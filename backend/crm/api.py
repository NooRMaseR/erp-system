from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, F
from django.template.loader import render_to_string
from django_bolt.exceptions import BadRequest, NotFound
from django_bolt import BoltAPI, IsAuthenticated, JWTAuthentication, Request, Response

from core.models import AuditTrail, ERPUser, ERPUserRole
from core.permissions import AreAdmins, IsClient, IsNotClient
from financials.models import Invoice, InvoiceItem, InvoiceStatus

from .serializers import (
    ClientInvoiceResponse,
    ClientLookupOption,
    ClientStatus,
    CreateClientRequest,
    CreateClientResponse,
    CrmClientResponse,
)
from .models import ClientProfile

from asgiref.sync import sync_to_async
from weasyprint import HTML
from decimal import Decimal
import asyncio


app = BoltAPI(
    prefix="/crm",
    trailing_slash="append",
)

@app.get("/clients/", auth=[JWTAuthentication()], guards=[IsAuthenticated(), IsNotClient])
async def get_crm_clients_api(company: str | None = None) -> list[CrmClientResponse]:
    """Fetches the list of corporate retainers"""

    profiles = ClientProfile.objects.select_related("user").order_by("-created_at")
    if company:
        profiles = profiles.filter(company_name__icontains=company)

    current_date = timezone.now().date()

    data: list[CrmClientResponse] = [
        CrmClientResponse(
            id=profile.pk,
            companyName=profile.company_name,
            taxRegistration=profile.tax_registration_number,
            contactEmail=profile.user.email,
            phone=str(profile.user.phone_number) if profile.user.phone_number else "N/A",
            status=ClientStatus.ACTIVE if profile.user.is_active else ClientStatus.INACTIVE,
            daysActive=(current_date - profile.created_at.date()).days,
            registeredDate=profile.created_at.date().strftime("%b %d, %Y"),
        )
        async for profile in profiles
    ]
    return data


@app.get("/clients/lookup", auth=[JWTAuthentication()], guards=[IsAuthenticated(), IsNotClient])
async def client_lookup_api() -> list[ClientLookupOption]:
    """Lightweight endpoint to populate dropdowns in the frontend for clients."""
    options = [
        ClientLookupOption(id=profile.pk, name=profile.company_name)
        async for profile in ClientProfile.objects.order_by("company_name")
    ]

    return options


def create_client_sync(payload: CreateClientRequest) -> dict:
    with transaction.atomic():
        # الخطوة الأولى: إنشاء حساب المستخدم (للدخول على الـ Client Portal)
        user = ERPUser(
            username=payload.companyName,
            email=payload.contactEmail,
            phone_number=payload.phone,
            role=ERPUserRole.CLIENT
        )
        user.set_password(payload.password)
        user.save()

        # الخطوة الثانية: إنشاء الملف التجاري وربطه بالمستخدم
        profile = ClientProfile.objects.create(
            user=user,
            company_name=payload.companyName,
            tax_registration_number=payload.taxRegistration,
            commercial_register_id=payload.commercialRegister,
            company_address=payload.companyAddress
        )

        return {
            "clientId": profile.pk,
            "userId": user.pk
        }

@app.post("/clients/create/", auth=[JWTAuthentication()], guards=[IsAuthenticated(), AreAdmins])
async def create_client(request: Request, payload: CreateClientRequest) -> CreateClientResponse:
    """create a new client with commercial register (require admin permissions)"""
    
    email_exists, tax_exists = await asyncio.gather(
        ERPUser.objects.filter(email=payload.contactEmail).aexists(),
        ClientProfile.objects.filter(tax_registration_number=payload.taxRegistration).aexists()
    )

    if email_exists:
        raise BadRequest(detail="البريد الإلكتروني مسجل بالفعل في النظام.")
        
    if tax_exists:
        raise BadRequest(detail="رقم التسجيل الضريبي مسجل مسبقاً لشركة أخرى.")
        
    result = await sync_to_async(create_client_sync)(payload)
    await AuditTrail.objects.acreate(
        user=request.user,
        action=f"أضاف عميل جديد: {payload.companyName}",
        module="crm",
        row_id=result["clientId"]
    )
    
    return CreateClientResponse(
        message="تم إنشاء حساب العميل والملف الضريبي بنجاح.",
        clientId=result["clientId"],
        userId=result["userId"]
    )


@app.get("/client/invoices/", tags=["Client Portal", "Crm"], auth=[JWTAuthentication()], guards=[IsAuthenticated(), IsClient])
async def list_client_invoices(request: Request) -> list[ClientInvoiceResponse]:
    
    try:
        client_profile = await ClientProfile.objects.aget(user_id=request.context['user_id'])
    except ClientProfile.DoesNotExist:
        raise NotFound(detail="لم يتم إجاد حسابك، يرجى التواصل معنا")
    
    invoices_query = (
        Invoice.objects
        .annotate(
            calculated_total=Sum(
                F("items__quantity")
                * F("items__unit_price")
                * (1 + F("items__vat_rate"))
            )
        )
        .filter(client_user=client_profile)
        .exclude(status=InvoiceStatus.DRAFT)
        .order_by('-created_at')
    )
    
    results = [
        ClientInvoiceResponse(
            id=inv.pk,
            invoice_number=inv.invoice_number,
            date=inv.created_at.strftime('%Y-%m-%d'),
            amount=float(inv.calculated_total), # type: ignore
            status=InvoiceStatus(inv.status)
        )
        async for inv in invoices_query 
    ]
        
    return results


@app.get("/client/invoices/{invoice_id}/pdf/", tags=["Client Portal", "Crm"], auth=[JWTAuthentication()], guards=[IsAuthenticated(), IsClient])
def download_invoice_pdf_api(request: Request, invoice_id: int):
    """
    توليد وتحميل ملف الـ PDF الخاص بالفاتورة.
    """
    try:
        client_profile = request.user.crm_profile
        invoice = (
            Invoice.objects
            .select_related("client_user__user")
            .prefetch_related("items")
            .get(id=invoice_id, client_user=client_profile)
        )
    except Invoice.DoesNotExist:
        raise NotFound(detail="Invoice not found or access denied.")

    items: list[InvoiceItem] = invoice.items.all() # type: ignore
    subtotal: Decimal = Decimal()
    vat_total: Decimal = Decimal()
    for item in items:
        subtotal += item.subtotal
        vat_total += item.vat_amount

    context = {
        'invoice_number': invoice.invoice_number,
        'client_name': invoice.client_user.user.username,
        'issue_date': invoice.created_at.strftime('%Y-%m-%d'),
        'items': (
            {
                'description': item.description, 
                'quantity': item.quantity, 
                'unit_price': item.unit_price, 
                'total': item.total_cost 
            }
            for item in items
        ),
        'subtotal': subtotal,
        'vat_total': vat_total,
        'grand_total': invoice.total_amount
    }

    html_string = render_to_string('invoice-pill-pdf.html', context)
    pdf_file = HTML(string=html_string).write_pdf()
    
    return Response(
        pdf_file, 
        media_type='application/pdf',
        headers={
            "Content-Disposition": f'attachment; filename="{invoice.invoice_number}.pdf"'
        }
    )