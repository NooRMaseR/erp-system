import random
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta, date
from django.core.management.base import BaseCommand

from hr.models import PayrollPeriod, Payslip
from crm.models import ClientProfile, CorporateContract
from core.models import ERPUser, ERPUserRole, AuditTrail
from financials.models import Invoice, InvoiceItem, InvoiceStatus
from hr.models import Department, EmployeeProfile, AttendanceLog, AttendanceStatus


class Command(BaseCommand):
    help = "Seeds the AccountFlow Pro ERP database with realistic historical business intelligence arrays."

    def handle(self, *args, **options) -> None:
        self.stdout.write(self.style.WARNING("Clearing existing workspace arrays..."))
        
        # Safe cascading deletion of non-auth target tables
        Invoice.objects.all().delete()
        EmployeeProfile.objects.all().delete()
        ClientProfile.objects.all().delete()
        Department.objects.all().delete()
        PayrollPeriod.objects.all().delete()
        ERPUser.objects.filter(is_superuser=False).delete()

        self.stdout.write(self.style.SUCCESS("Database wiped clean. Starting data generation..."))

        # --- 1. GENERATE DEPARTMENTS ---
        dept_data = [
            {"name": "Corporate Tax & Compliance", "code": "TAX"},
            {"name": "External Auditing Services", "code": "AUDIT"},
            {"name": "Financial Advisory & Planning", "code": "ADVISORY"}
        ]
        departments = []
        for d in dept_data:
            dept = Department.objects.create(name=d["name"], code=d["code"])
            departments.append(dept)

        # --- 2. GENERATE FIRM STAFF & PROFILES ---
        positions = ["Junior Auditor", "Senior Consultant", "Tax Associate", "Managing Partner"]
        first_names = ["Ahmed", "Mohamed", "Amr", "Youssef", "Tarek", "Nour", "Fatma", "Rania", "Mai"]
        last_names = ["Moustafa", "El-Gammal", "Mansour", "Hassan", "Salama", "Khalil", "Shahin"]

        self.stdout.write("Generating staff infrastructure...")
        employees = []
        
        # Ensure at least one known manager account exists for demo purposes
        manager_user = ERPUser.objects.create(
            username="manager_demo",
            email="manager@firm.com",
            password="password123",
            role=ERPUserRole.MANAGER,
        )
        # Assign manager to the Tax department
        departments[0].manager = manager_user
        departments[0].save()

        emp_profile_manager = EmployeeProfile.objects.create(
            user=manager_user,
            department=departments[0],
            position="Managing Partner",
            national_id=f"2900101120{random.randint(1000, 9999)}",
            hire_date=date(2024, 1, 1),
            base_salary=Decimal("45000.00")
        )
        employees.append(emp_profile_manager)

        # Generate 8 random internal staff members
        for i in range(8):
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            uname = f"{fname.lower()}.{lname.lower()}_{i}"
            
            user = ERPUser.objects.create(
                username=uname,
                email=f"{uname}@accountflow.com",
                password="password123",
                role=ERPUserRole.EMPLOYEE,
            )
            
            profile = EmployeeProfile.objects.create(
                user=user,
                department=random.choice(departments),
                position=random.choice(positions),
                national_id=f"2950512140{random.randint(1000, 9999)}",
                hire_date=date(2025, 3, 1),
                base_salary=Decimal(random.randint(12000, 28000))
            )
            employees.append(profile)

        # --- 3. GENERATE B2B CLIENTS & RETAINER CONTRACTS ---
        client_companies = [
            "Cairo Logistics Hub", "Alexandria Maritime Trading", "Giza Tech Solutions", 
            "Delta Agricultural Corp", "Nile Real Estate Group", "Red Sea Hospitality Networks",
            "Suez Industrial Manufacturing", "Upper Egypt Agro-Mills"
        ]
        
        self.stdout.write("Generating B2B client corporate portfolio...")
        clients: list[ClientProfile] = []
        contracts: list[CorporateContract] = []
        
        for idx, comp in enumerate(client_companies):
            uname = f"client_node_{idx}"
            user = ERPUser.objects.create(
                username=uname,
                email=f"finance@{comp.lower().replace(' ', '')}.com",
                password="password123",
                role=ERPUserRole.CLIENT,
            )
            
            client_profile = ClientProfile(
                user=user,
                company_name=comp,
                tax_registration_number=f"{random.randint(100000000, 999999999)}", # Authentic 9-digit registration formats
                commercial_register_id=f"CR-{random.randint(5000, 95000)}",
                company_address=f"Building {random.randint(1, 150)}, Financial District, Cairo, Egypt"
            )
            clients.append(client_profile)

            # Assign an active operational retainer contract to each corporate client
            contracts.append(
                CorporateContract(
                    client=client_profile,
                    title=f"Annual Accounting & Tax Retainer - 2026",
                    start_date=date(2026, 1, 1),
                    end_date=date(2026, 12, 31),
                    total_value=Decimal(random.randint(60000, 240000)),
                    is_active=True
                )
            )

        ClientProfile.objects.bulk_create(clients)
        CorporateContract.objects.bulk_create(contracts)
        
        # --- 4. GENERATE 90 DAYS OF HISTORICAL INVOICES & LEDGER ENTRIES ---
        self.stdout.write("Simulating 90-day time-series historical invoices...")
        today = timezone.now().date()
        service_descriptions = [
            ("Monthly VAT Filing & Corporate Bookkeeping", Decimal("4500.00")),
            ("Quarterly Financial Auditing Consultation", Decimal("12500.00")),
            ("Corporate Tax Return Preparation & Compliance", Decimal("8000.00")),
            ("Customs Duties Strategy Advisory Session", Decimal("6000.00")),
            ("Egyptian Tax Authority Representation Representation", Decimal("15000.00"))
        ]

        invoice_serial = 101
        for day_offset in range(90, 0, -5): # Creates an invoice tracking plot point roughly every 5 days
            invoice_date = today - timedelta(days=day_offset)
            target_client = random.choice(clients)
            
            inv = Invoice.objects.create(
                client_user=target_client,
                invoice_number=f"INV-2026-{invoice_serial}",
                due_date=invoice_date + timedelta(days=30),
                status=random.choice([InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.SENT]), # Weight toward paid entries
                is_locked=True if invoice_date < (today - timedelta(days=30)) else False,
                created_at=timezone.make_aware(timezone.datetime.combine(invoice_date, timezone.datetime.min.time()))
            )
            invoice_serial += 1

            # Attach 1 to 2 line-item breakouts per billing instance
            chosen_services = random.sample(service_descriptions, k=random.randint(1, 2))
            for desc, base_rate in chosen_services:
                InvoiceItem.objects.create(
                    invoice=inv,
                    description=desc,
                    quantity=random.randint(1, 3),
                    unit_price=base_rate,
                    vat_rate=Decimal("0.14") # Strict standard Egyptian corporate VAT mapping
                )

        # --- 5. GENERATE COMPLETED PAYROLL HISTORY ---
        self.stdout.write("Processing past historical payroll periods...")
        # Seed records for completed months in 2026 leading up to July
        past_months = [(4, 2026), (5, 2026), (6, 2026)]
        
        for m, y in past_months:
            period = PayrollPeriod.objects.create(
                month=m,
                year=y,
                is_processed=True,
                processed_at=timezone.now() - timedelta(days=(30 * (6 - m)))
            )
            
            for emp in employees:
                bonus = Decimal(random.choice([0, 0, 500, 1500, 2000]))
                deduction = Decimal(random.choice([0, 0, 0, 350, 600]))
                
                # Mock tax computation structures
                social_sec = emp.base_salary * Decimal("0.11") # Typical employee cut percentage
                income_tax = (emp.base_salary + bonus - deduction) * Decimal("0.10") # Normalized basic bracket modeling
                net = (emp.base_salary + bonus) - (deduction + social_sec + income_tax)

                Payslip.objects.create(
                    employee=emp,
                    period=period,
                    base_salary_snapshot=emp.base_salary,
                    bonuses=bonus,
                    deductions=deduction,
                    social_insurance=social_sec,
                    income_tax_withheld=income_tax,
                    net_salary=net
                )

        # --- 6. GENERATE ATTENDANCE RECORD MATRIX ---
        self.stdout.write("Simulating daily staff attendance sheets...")
        for day_offset in range(15, 0, -1):
            log_date = today - timedelta(days=day_offset)
            if log_date.weekday() in [4, 5]: # Ignore Friday/Saturday weekend windows in Egypt
                continue
                
            for emp in employees:
                # 90% chance present, 7% late, 3% absent simulation
                roll = random.random()
                if roll < 0.90:
                    status = AttendanceStatus.PRESENT
                    clock_i, clock_o = "09:00:00", "17:00:00"
                elif roll < 0.97:
                    status = AttendanceStatus.LATE
                    clock_i, clock_o = "10:15:00", "17:00:00"
                else:
                    status = AttendanceStatus.ABSENT
                    clock_i, clock_o = None, None

                AttendanceLog.objects.create(
                    employee=emp,
                    date=log_date,
                    clock_in=clock_i,
                    clock_out=clock_o,
                    status=status
                )

        # --- 7. EMIT SYSTEM AUDIT COMPLIANCE RECORDS ---
        AuditTrail.objects.create(
            user=manager_user,
            action="Executed Global System Data Optimization Suite",
            module="Core Architecture SEED",
            row_id=1,
            changes={"execution_status": "Complete"}
        )

        self.stdout.write(self.style.SUCCESS("AccountFlow Pro database array seeding sequence concluded perfectly."))
