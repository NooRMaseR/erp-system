from django_bolt import (
    create_jwt_for_user,
    JWTAuthentication,
    IsAuthenticated,
    OpenAPIConfig,
    BoltAPI,
    Request,
)
from django.contrib.auth import aauthenticate
from django_bolt.exceptions import NotFound
from django.db.models import Sum, F

from .serializers import AuditLogSerializer, ChartDataSerializer, DashboardStatsSerializer
from .models import AuditTrail, ERPUser, ERPUserRole
from .schemas import LoginRequest, LoginResponse, TokensResponse
from .permissions import AreAdmins, IsNotClient

from financials.models import InvoiceItem, InvoiceStatus
from crm.models import ClientProfile
from hr.models import Payslip
import asyncio


app = BoltAPI(
    openapi_config=OpenAPIConfig(title="ERP System", version="0.2"),
    trailing_slash="append"
)

@app.post("/login", tags=["Auth"])
async def login(request: Request, payload: LoginRequest) -> LoginResponse:
    USER: ERPUser = await aauthenticate(request, email=payload.email, password=payload.password)  # type: ignore
    if not USER:
        raise NotFound(detail="Email or Password are invalid")

    token = create_jwt_for_user(USER, expires_in=3600, extra_claims={"role": USER.role})
    refresh_token = create_jwt_for_user(
        USER, 
        expires_in=3600 * 24 * 7, # 7 أيام
        extra_claims={
            "role": USER.role, 
            "typ": "refresh"
        }
    )

    return LoginResponse(
        email=USER.email,
        username=USER.username,
        tokens=TokensResponse(token, refresh_token),
        role=ERPUserRole(USER.role)
    )

@app.get("/test-auth/", tags=["Auth"], response_model=LoginResponse, auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def test_auth(request: Request) -> LoginResponse:
    USER: ERPUser = request.user
    
    return LoginResponse(email=USER.email, username=USER.username, tokens=TokensResponse("", ""), role=ERPUserRole(USER.role))


@app.get("/refresh-token/", tags=["Auth"], auth=[JWTAuthentication(token_type="refresh")])
async def refresh_token(request: Request) -> TokensResponse:
    USER: ERPUser = request.user

    token = create_jwt_for_user(USER, expires_in=3600, extra_claims={"role": USER.role})

    return TokensResponse(token, "")


@app.get("/dashboard/", tags=["Overview"], auth=[JWTAuthentication()], guards=[IsAuthenticated(), IsNotClient])
async def get_dashboard() -> DashboardStatsSerializer:
    """
    جلب إحصائيات لوحة القيادة.
    """
    paid_agg, sent_agg, payroll_agg, active_clients = await asyncio.gather(
        # 1. إجمالي الإيرادات المحصلة (PAID) - استخدام F expressions لحساب دقيق وسريع جداً داخل Postgres
        InvoiceItem.objects.filter(invoice__status=InvoiceStatus.PAID).aaggregate(
            total=Sum(F("quantity") * F("unit_price") * (1 + F("vat_rate")))
        ),
        
        # 2. المستحقات المتأخرة (SENT)
        InvoiceItem.objects.filter(invoice__status=InvoiceStatus.SENT).aaggregate(
            total=Sum(F("quantity") * F("unit_price") * (1 + F("vat_rate")))
        ),
        
        # 3. إجمالي مصروفات الرواتب (المعتمدة فقط)
        Payslip.objects.filter(period__is_processed=True).aaggregate(
            total=Sum('net_salary')
        ),
        
        # 4. عدد العملاء 
        ClientProfile.objects.acount()
    )
    total_revenue = float(paid_agg['total'] or 0.0)
    pending_receivables = float(sent_agg['total'] or 0.0)
    total_payroll = float(payroll_agg['total'] or 0.0)

    # 5. بيانات الرسم البياني
    chart_data = [
        ChartDataSerializer(month="فبراير", revenue=32000, payroll=15000),
        ChartDataSerializer(month="مارس", revenue=45000, payroll=15000),
        ChartDataSerializer(month="أبريل", revenue=38000, payroll=18000),
        ChartDataSerializer(month="مايو", revenue=61000, payroll=18000),
        ChartDataSerializer(month="يونيو", revenue=59000, payroll=22000),
        ChartDataSerializer(month="يوليو", revenue=72000, payroll=22000),
    ]

    return DashboardStatsSerializer(
        totalRevenue=total_revenue,
        pendingReceivables=pending_receivables,
        totalPayroll=total_payroll,
        activeClients=active_clients,
        chartData=chart_data
    )


@app.get("/audit-logs/", tags=["Overview"], auth=[JWTAuthentication()], guards=[IsAuthenticated(), AreAdmins])
async def list_audit_logs_api(user: str | None = None, module: str | None = None) -> list[AuditLogSerializer]:
    logs_query = (
        AuditTrail.objects
        .select_related('user')
        .only(
            "id",
            "user_id",
            "user__username",
            "user__email",
            "action",
            "module",
            "timestamp",
            "changes",
        )
        .order_by('-id')
    )
    if user:
        logs_query = logs_query.filter(user__username__icontains=user)
    
    if module:
        logs_query = logs_query.filter(module__icontains=module)
    
    results = [
        AuditLogSerializer(
            id=log.pk,
            username=log.user.username,
            email=log.user.email,
            action=log.action,
            module=log.module,
            date=log.timestamp.strftime('%Y-%m-%d %H:%M'),
            changes=log.changes or {}
        )
        async for log in logs_query[:50]
    ]
    return results
