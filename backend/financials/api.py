from django_bolt import BoltAPI, IsAuthenticated, JWTAuthentication, Request, Response, status_codes
from django_bolt.exceptions import BadRequest, NotFound
from django.db.models.functions import Coalesce
from django.db.models import Sum, F, Count
from django.utils import timezone
from django.db import transaction

from core.permissions import AreAdmins, IsNotClient
from crm.models import ClientProfile
from core.models import AuditTrail
from hr.models import PayrollPeriod

from .serializers import LedgerItem, InvoiceCreatePayload, InvoiceCreateResponse, PayrollLedgerSerializer, PayrollStatus
from .schemas import InvoiceItemPayload, StatusUpdatePayload, InvoiceEditPayload
from .models import Invoice, InvoiceItem, InvoiceStatus

from asgiref.sync import sync_to_async
from typing import Annotated
from decimal import Decimal
import msgspec

app = BoltAPI(
    prefix="/ledger",
    trailing_slash="append",
)

@app.get("/", tags=["Financials"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def get_ledger(inv: str | None = None, client: str | None = None, status: str | None = None) -> list[LedgerItem]:

    invoices = Invoice.objects.select_related("client_user").annotate(
        calculated_total=Sum(
            F("items__quantity") * F("items__unit_price") * (1 + F("items__vat_rate"))
        )
    )

    if inv:
        invoices = invoices.filter(invoice_number__icontains=inv)
    if client:
        invoices = invoices.filter(
            client_user__crm_profile__company_name__icontains=client
        )
    if status and status != "ALL":
        invoices = invoices.filter(status=status)

    invoices = invoices.order_by("-created_at")[:20]

    data = [
        LedgerItem(
            id=str(db_inv.invoice_number),
            client=db_inv.client_user.company_name,
            date=db_inv.created_at.strftime("%b %d, %Y"),
            amount=f"EGP {float(db_inv.calculated_total or 0.0):,.2f}", # type: ignore
            status=InvoiceStatus(db_inv.status),
            eta=(
                "Approved"
                if db_inv.eta_uuid
                else (
                    "Pending"
                    if db_inv.status == InvoiceStatus.SENT
                    else "Not Submitted"
                )
            ),
            is_locked=db_inv.is_locked,
        )
        async for db_inv in invoices
    ]

    return data


# قاموس بسيط لتحويل رقم الشهر إلى اسمه بالعربية
ARABIC_MONTHS = {
    1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
    5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
    9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
}

@app.get("/payrolls/", tags=["Financials"], auth=[JWTAuthentication()], guards=[IsAuthenticated(), IsNotClient])
async def list_ledger_payrolls_api() -> list[PayrollLedgerSerializer]:
    """
    جلب مسيرات الرواتب (Payroll Periods) وحساب إجمالياتها ديناميكياً.
    """
    
    payrolls_query = PayrollPeriod.objects.annotate(
        employees_count=Count('payslips'),
        total_net=Coalesce(Sum('payslips__net_salary'), Decimal('0.00'))
    ).order_by('-year', '-month')
    
    results: list[PayrollLedgerSerializer] = [
        PayrollLedgerSerializer(
            id=f"PAY-{payroll.year}-{payroll.month:02d}", # e.g., PAY-2026-07
            month=f"{ARABIC_MONTHS.get(payroll.month, str(payroll.month))} {payroll.year}",
            employeesCount=payroll.employees_count, # type: ignore
            totalNetSalaries=float(payroll.total_net), # type: ignore
            status=PayrollStatus.PAID if payroll.is_processed else PayrollStatus.PENDING
        )
        async for payroll in payrolls_query
    ]
    
    return results

@app.post("/payrolls/{payroll_id}/approve/", tags=["Financials"], auth=[JWTAuthentication()], guards=[IsAuthenticated(), AreAdmins])
async def approve_payroll_api(request: Request, payroll_id: Annotated[str, msgspec.Meta(pattern=r"^PAY\-\d{4}\-\d{2}$")]):
    """
    اعتماد صرف مسير الرواتب وتحديث حالته.
    payroll_id متوقع بصيغة: PAY-YYYY-MM (مثال: PAY-2026-07)
    """
    
    try:
        _, year_str, month_str = payroll_id.split('-')
        year = int(year_str)
        month = int(month_str)
    except ValueError:
        raise BadRequest(detail="صيغة معرّف الرواتب غير صحيحة.")

    try:
        payroll = await PayrollPeriod.objects.aget(year=year, month=month)
    except PayrollPeriod.DoesNotExist:
        raise NotFound(detail="مسير الرواتب غير موجود.")
        
    # التأكد من أنه لم يعتمد مسبقاً
    if payroll.is_processed:
        raise BadRequest(detail="تم اعتماد هذا المسير مسبقاً.")
        
    payroll.is_processed = True
    payroll.processed_at = timezone.now()
    await payroll.asave(update_fields=("is_processed", "processed_at"))
    
    await AuditTrail.objects.acreate(
        user=request.user,
        action=f"اعتمد مصروفات لـ {month}/{year}",
        module="financials",
        row_id=payroll.pk,
        changes={"payroll": {"is_processed": True, "processed_at": str(payroll.processed_at)}},
    )
    
    return Response(status_code=status_codes.HTTP_204_NO_CONTENT)


@app.patch("/{invoice_number}/status/", tags=["Financials"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def update_invoice_status(invoice_number: str, payload: StatusUpdatePayload) -> LedgerItem:
    invoice = await (
        Invoice.objects.only("invoice_number", "eta_uuid", "status", "is_locked", "created_at", "client_user__user__email").select_related("client_user__user")
        .annotate(
            calculated_total=Sum(
                F("items__quantity")
                * F("items__unit_price")
                * (1 + F("items__vat_rate"))
            )
        )
        .aget(invoice_number=invoice_number)
    )
    
    updates: set[str] = {"status"}

    invoice.status = payload.status
    if payload.status in (InvoiceStatus.SENT, InvoiceStatus.PAID):
        invoice.is_locked = True
        updates.add("is_locked")
    
    await invoice.asave(update_fields=updates)

    return LedgerItem(
        id=invoice.invoice_number,
        client=invoice.client_user.user.email,
        date=invoice.created_at.strftime("%b %d, %Y"),
        amount=invoice.calculated_total, # type: ignore
        status=InvoiceStatus(invoice.status),
        eta="Pending" if not invoice.eta_uuid else invoice.eta_uuid,
        is_locked=invoice.is_locked,
    )


@app.get("/{invoice_number}/bands/", tags=["Financials"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def get_invoice_lines(invoice_number: str) -> InvoiceEditPayload:
    invoice = await Invoice.objects.prefetch_related("items").aget(invoice_number=invoice_number)
    
    return InvoiceEditPayload(
        due_date=invoice.due_date,
        items=[
            InvoiceItemPayload(
                id=item.id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                vat_rate=item.vat_rate
            )
            async for item in invoice.items.all() # type: ignore
        ]
    )

def process_invoice_edit_sync(user, invoice_number: str, payload: InvoiceEditPayload) -> LedgerItem:
    with transaction.atomic():
        try:
            invoice = Invoice.objects.select_for_update().get(
                invoice_number=invoice_number
            )
        except Invoice.DoesNotExist:
            raise BadRequest(detail="Invoice not found.")

        if invoice.is_locked:
            raise BadRequest(
                detail="This invoice is legally locked and cannot be edited."
            )

        before_state = {
            "due_date": str(invoice.due_date),
            "items": [
                {
                    "id": item.id,
                    "description": item.description,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "vat_rate": str(item.vat_rate)
                }
                for item in invoice.items.all() # type: ignore
            ]
        }

        # --- بداية عمليات التعديل (كما كتبتها أنت) ---
        if payload.due_date:
            invoice.due_date = payload.due_date
            invoice.save(update_fields=["due_date"])

        incoming_updates = {
            item.id: item for item in payload.items if item.id is not None
        }
        new_items_payload = [item for item in payload.items if item.id is None]

        # A. Delete old items instantly
        invoice.items.exclude(id__in=incoming_updates.keys()).delete() # type: ignore

        # B. Process Updates efficiently
        items_to_edit: list[InvoiceItem] = []
        fields_to_edit: set[str] = set()
        
        for db_item in invoice.items.filter(id__in=incoming_updates.keys()): # type: ignore
            incoming = incoming_updates[db_item.pk]

            if db_item.description != incoming.description:
                db_item.description = incoming.description
                fields_to_edit.add("description")

            if db_item.quantity != incoming.quantity:
                db_item.quantity = incoming.quantity
                fields_to_edit.add("quantity")

            if db_item.unit_price != incoming.unit_price:
                db_item.unit_price = incoming.unit_price
                fields_to_edit.add("unit_price")

            if db_item.vat_rate != incoming.vat_rate:
                db_item.vat_rate = incoming.vat_rate
                fields_to_edit.add("vat_rate")

            if fields_to_edit: # فقط إذا كان هناك تغيير
                items_to_edit.append(db_item)

        if items_to_edit and fields_to_edit:
            InvoiceItem.objects.bulk_update(
                items_to_edit, fields_to_edit, batch_size=500
            )

        # C. Process Brand New Items
        items_to_create = [
            InvoiceItem(
                invoice=invoice,
                description=new_item.description,
                quantity=new_item.quantity,
                unit_price=new_item.unit_price,
                vat_rate=new_item.vat_rate,
            )
            for new_item in new_items_payload
        ]

        if items_to_create:
            InvoiceItem.objects.bulk_create(items_to_create, batch_size=500)

        after_state = {
            "due_date": str(invoice.due_date),
            "items": [
                {
                    "id": item.id,
                    "description": item.description,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "vat_rate": str(item.vat_rate)
                }
                for item in invoice.items.all() # type: ignore
            ]
        }

        AuditTrail.objects.create(
            user=user,
            action=f"قام بتعديل بنود الفاتورة {invoice_number}",
            module="financials",
            row_id=invoice.pk,
            changes={
                "before": before_state,
                "after": after_state
            },
        )

        # 📊 [4] إعادة حساب الإجمالي للعرض
        revenue_calc = invoice.items.aggregate( # type: ignore
            total=Sum(F("quantity") * F("unit_price") * (1 + F("vat_rate")))
        )
        inv_total = float(revenue_calc["total"] or 0.0)

        # استخراج بيانات العميل
        company_name = "Unknown Client"
        try:
            profile = ClientProfile.objects.get(user_id=invoice.client_user.pk)
            company_name = profile.company_name
        except ClientProfile.DoesNotExist:
            pass

        eta_status = (
            "Approved"
            if invoice.eta_uuid
            else (
                "Pending" if invoice.status == InvoiceStatus.SENT else "Not Submitted"
            )
        )

        return LedgerItem(
            id=str(invoice.invoice_number),
            client=company_name,
            date=invoice.created_at.strftime("%b %d, %Y"),
            amount=f"EGP {inv_total:,.2f}",
            status=InvoiceStatus(invoice.status),
            eta=eta_status,
            is_locked=invoice.is_locked,
        )

@app.put("/{invoice_number}/edit/", tags=["Financials"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def edit_invoice_api(request: Request, invoice_number: str, payload: InvoiceEditPayload) -> LedgerItem:
    """Completely overwrites the invoice details and line items safely, with Audit Trail."""
    return await sync_to_async(process_invoice_edit_sync)(request.user, invoice_number, payload)

def process_invoice_create_sync(payload: InvoiceCreatePayload, client_user: ClientProfile) -> str:
    with transaction.atomic():
        invoice = Invoice.objects.create(
            client_user=client_user,
            due_date=payload.dueDate,
            status=InvoiceStatus.DRAFT,
            is_locked=False,
        )

        items_to_create = [
            InvoiceItem(
                invoice=invoice,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unitPrice,
                vat_rate=item.vatRate,
            )
            for item in payload.items
        ]

        InvoiceItem.objects.bulk_create(items_to_create, batch_size=500)

        return invoice.invoice_number


@app.post("/create/", tags=["Financials"], auth=[JWTAuthentication()], guards=[IsAuthenticated()])
async def create_invoice_api(request: Request, payload: InvoiceCreatePayload) -> InvoiceCreateResponse:
    """Creates a brand new invoice and its line items atomically."""

    if not payload.items:
        raise BadRequest(detail="An invoice must contain at least one line item.")
    
    try:
        client_user = await (
            ClientProfile.objects
            .only("id")
            .aget(id=payload.clientId)
        )
    except ClientProfile.DoesNotExist:
        raise BadRequest(detail="The selected client does not exist in the CRM.")

    invoice_serial = await sync_to_async(process_invoice_create_sync)(payload, client_user)
    await AuditTrail.objects.acreate(
        user=request.user,
        action=f"انشاء فاتورة {invoice_serial} لـ {client_user.company_name}",
        module="financials",
        row_id=invoice_serial,
    )

    return InvoiceCreateResponse(
        id=invoice_serial,
        message="Invoice draft generated successfully."
    )
