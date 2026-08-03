from django.db import transaction
from django.utils import timezone
from django_bolt.exceptions import BadRequest
from django.db.models import Count, Q, Prefetch
from django_bolt import BoltAPI, IsAuthenticated, JWTAuthentication, Request

from .serializers import (
    CreateEmployeeResponse,
    ProcessPayrollResponse,
    DepartmentSerializer,
    HRDashboardResponse,
    EmployeeHROption,
)
from .models import (
    AttendanceStatus,
    EmployeeProfile,
    AttendanceLog,
    PayrollPeriod,
    Department,
    Payslip,
)
from .schemas import CreateEmployeeRequest, ProcessPayrollRequest
from core.models import AuditTrail, ERPUser, ERPUserRole

from asgiref.sync import sync_to_async
from decimal import Decimal
import polars as pl
import asyncio

app = BoltAPI(
    prefix="/hr",
    trailing_slash="append",
)

@app.get("/dashboard/", tags=["HR"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def get_hr_dashboard_api(user: str | None = None) -> HRDashboardResponse:
    """Fetches HR metrics and employee list with today's attendance status."""

    today = timezone.now().date()

    # 1. Fetch all active employees with their related user and department data
    employees_qs = (
        EmployeeProfile.objects
        .select_related("user", "department")
        .prefetch_related(
            Prefetch(
                "attendance", 
                AttendanceLog.objects.filter(date=today)[:1],
                "today_attendance"
            )
        )
        .filter(is_active=True)
    )
    
    if user:
        employees_qs = employees_qs.filter(user__username__icontains=user)

    total_emp = 0
    present_count = 0
    leave_count = 0
    absent_count = 0

    employee_list: list[EmployeeHROption] = []

    async for emp in employees_qs:
        total_emp += 1

        # 2. Check today's attendance for this employee
        attendance: AttendanceLog = emp.today_attendance # type:ignore

        status = attendance.status if attendance else "ABSENT"
        clock_in = (
            attendance.clock_in.strftime("%I:%M %p")
            if attendance and attendance.clock_in
            else None
        )
        
        match status:
            case AttendanceStatus.PRESENT | AttendanceStatus.LATE:
                present_count += 1
            case AttendanceStatus.LEAVE:
                leave_count += 1
            case _:
                absent_count += 1

        employee_list.append(
            EmployeeHROption(
                id=emp.pk,
                fullName=emp.user.username,
                email=emp.user.email,
                position=emp.position,
                department=emp.department.name,
                nationalId=emp.national_id,
                todayStatus=AttendanceStatus(status),
                clockIn=clock_in,
            )
        )

    return HRDashboardResponse(
        totalEmployees=total_emp,
        presentToday=present_count,
        onLeave=leave_count,
        absentToday=absent_count,
        employees=employee_list,
    )

def create_employee_sync(payload: CreateEmployeeRequest) -> dict:
    with transaction.atomic():
        # 2. Create Login Credentials
        user = ERPUser(
            username=payload.fullName,
            email=payload.email,
            phone_number=payload.phone,
            role=ERPUserRole.EMPLOYEE,
            is_active=True,
            is_staff=True # لأنهم موظفين في الشركة
        )
        user.set_password(payload.password)
        user.save()

        # 3. Create HR Profile
        profile = EmployeeProfile.objects.create(
            user=user,
            department_id=payload.departmentId,
            position=payload.position,
            national_id=payload.nationalId,
            hire_date=payload.hireDate,
            base_salary=payload.baseSalary,
            is_active=True
        )

        return {"employeeId": profile.pk}


@app.post("/employees/create", tags=["HR"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def create_employee_api(request: Request, payload: CreateEmployeeRequest) -> CreateEmployeeResponse:
    """إنشاء حساب موظف وملفه الوظيفي في خطوة واحدة."""

    if len(str(payload.nationalId)) != 14:
        raise BadRequest(detail="الرقم القومي يجب أن يتكون من 14 رقماً بالضبط.")
    
    email_exists, national_exists = await asyncio.gather(
        ERPUser.objects.filter(email=payload.email).aexists(),
        EmployeeProfile.objects.filter(national_id=payload.nationalId).aexists()
    )
        
    if email_exists:
        raise BadRequest(detail="البريد الإلكتروني مسجل بالفعل لموظف أو عميل آخر.")
        
    if national_exists:
        raise BadRequest(detail="الرقم القومي مسجل مسبقاً لموظف آخر.")
    
    result = await sync_to_async(create_employee_sync)(payload)
    await AuditTrail.objects.acreate(
        user=request.user,
        action=f"تم تعيين موظف جديد: {payload.fullName}",
        module="hr",
        row_id=result['employeeId']
    )
    
    return CreateEmployeeResponse(
        message="تم إنشاء ملف الموظف بنجاح.",
        employeeId=result["employeeId"]
    )

def execute_payroll_run_sync(payload: ProcessPayrollRequest) -> dict:
    with transaction.atomic():
        period, _ = PayrollPeriod.objects.get_or_create(
            month=payload.month, year=payload.year
        )

        if period.is_processed:
            raise BadRequest(
                detail="This payroll period has already been processed and locked."
            )

        # 2. Fetch Employee Data & Aggregate Attendance (Absences)
        # We count how many days the employee had an "ABSENT" status in this specific month/year
        employees = (
            EmployeeProfile.objects.filter(is_active=True)
            .annotate(
                absent_days=Count(
                    "attendance",
                    filter=Q(
                        attendance__date__month=payload.month,
                        attendance__date__year=payload.year,
                        attendance__status=AttendanceStatus.ABSENT,
                    ),
                )
            )
            .values("id", "base_salary", "absent_days")
        )

        if not employees:
            raise BadRequest(detail="No active employees found for payroll processing.")

        # 3. Load into Polars for Vectorized Processing
        # Convert QuerySet to a list of dicts for Polars
        emp_data = list(employees)

        # We cast base_salary to Float64 for the math operations
        df = pl.DataFrame(emp_data).with_columns(
            [pl.col("base_salary").cast(pl.Float64)]
        )

        # 4. The Polars Vectorized Math (Millisecond execution)
        df = df.with_columns(
            [
                # Deductions: (Base / 30 days) * absent days
                ((pl.col("base_salary") / 30) * pl.col("absent_days")).alias(
                    "deductions"
                ),
            ]
        )

        df = df.with_columns(
            [
                # Gross Taxable: Base - Deductions
                (pl.col("base_salary") - pl.col("deductions")).alias("taxable_base")
            ]
        )

        df = df.with_columns(
            [
                # Social Insurance: standard 11% employee share in Egypt
                (pl.col("taxable_base") * 0.11).alias("social_insurance")
            ]
        )

        df = df.with_columns(
            [
                # Income Tax: simplified flat 10% for the demo (Real world applies ETA brackets here)
                ((pl.col("taxable_base") - pl.col("social_insurance")) * 0.10).alias(
                    "income_tax"
                )
            ]
        )

        df = df.with_columns(
            [
                # Final Net Salary
                (
                    pl.col("taxable_base")
                    - pl.col("social_insurance")
                    - pl.col("income_tax")
                ).alias("net_salary")
            ]
        )

        # 5. Bulk Insert to PostgreSQL
        payslips_to_create = [
            Payslip(
                employee_id=row["id"],
                period=period,
                base_salary_snapshot=Decimal(str(round(row["base_salary"], 2))),
                deductions=Decimal(str(round(row["deductions"], 2))),
                social_insurance=Decimal(str(round(row["social_insurance"], 2))),
                income_tax_withheld=Decimal(str(round(row["income_tax"], 2))),
                net_salary=Decimal(str(round(row["net_salary"], 2))),
            )
            for row in df.iter_rows(named=True)
        ]
        Payslip.objects.bulk_create(payslips_to_create, batch_size=500)

        return {
            "processedCount": len(payslips_to_create),
            "totalNetSalary": df["net_salary"].sum(),
            "periodId": period.pk
        }

@app.post("/payroll/process/", tags=["HR"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def process_payroll_api(payload: ProcessPayrollRequest) -> ProcessPayrollResponse:
    """Processes payroll."""
    
    result = await sync_to_async(execute_payroll_run_sync)(payload)
    await AuditTrail.objects.acreate(
        action=f"قام بأصدار الرواتب لـ {payload.month}/{payload.year}",
        module="hr",
        row_id=result['periodId'],
        changes={"processed_count": result['processedCount']},
    )

    return ProcessPayrollResponse(
        message="Payroll processed and locked successfully.",
        processedCount=result["processedCount"],
        totalNetSalary=result["totalNetSalary"],
    )


@app.get("/departments/", tags=["HR"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def list_departments_api() -> list[DepartmentSerializer]:
    """
    نقطة اتصال سريعة لجلب قائمة الأقسام.
    تستخدم لملء القوائم المنسدلة (Dropdowns) في واجهات النظام.
    """

    return [
        DepartmentSerializer.from_model(dept)
        async for dept in Department.objects.all()
    ]