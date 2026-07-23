from django_bolt import BoltAPI, OpenAPIConfig, Request, create_jwt_for_user
from django_bolt.exceptions import BadRequest
from django.contrib.auth import aauthenticate
from django_bolt.exceptions import NotFound
from django.db.models import Sum, F
from django.db import transaction
from django.utils import timezone

from .serializers import CRMItem, ClientLookupOption, HRItem, DashboardResponse, InvoiceCreatePayload, InvoiceCreateResponse, LedgerItem
from .schemas import (
    InvoiceEditPayload,
    LoginRequest,
    LoginResponse,
    StatusUpdatePayload,
)
from .models import ERPUser

from hr.models import AttendanceStatus, EmployeeProfile, AttendanceLog
from financials.models import Invoice, InvoiceItem, InvoiceStatus
from asgiref.sync import sync_to_async
from crm.models import ClientProfile
import asyncio

app = BoltAPI(
    openapi_config=OpenAPIConfig(title="ERP System", version="0.1"),
    trailing_slash="append",
)

@app.post("/login", tags=["Auth"])
async def login(request: Request, payload: LoginRequest) -> LoginResponse:
    USER: ERPUser = await aauthenticate(request, email=payload.email, password=payload.password)  # type: ignore
    if not USER:
        raise NotFound(detail="Email or Password are invalid")
    
    token = create_jwt_for_user(USER)

    return LoginResponse(
        email=USER.email,
        username=USER.username,
        token=token
    )


@app.get("/dashboard", tags=["Overview"])
async def dashboard_api() -> DashboardResponse:
    revenue_calc = await Invoice.objects.filter(status=InvoiceStatus.PAID).aaggregate(
        gross=Sum(
            F("items__quantity") * F("items__unit_price") * (1 + F("items__vat_rate"))
        )
    )
    total_revenue = float(revenue_calc["gross"] or 0.0)

    active_clients, pending_invoices = await asyncio.gather(
        ClientProfile.objects.acount(),
        Invoice.objects.filter(status=InvoiceStatus.SENT).acount(),
    )

    return DashboardResponse(
        totalRevenue=f"EGP {total_revenue:,.2f}",
        growth="+14.3%",
        activeClients=active_clients,
        pendingInvoices=pending_invoices
    )

@app.get("/ledger/", tags=["Financials"])
async def get_ledger(inv: str | None = None, client: str | None = None, status: str | None = None) -> list[LedgerItem]:
    
    invoices = Invoice.objects.select_related('client_user__crm_profile').annotate(
        calculated_total=Sum(F('items__quantity') * F('items__unit_price') * (1 + F('items__vat_rate')))
    )
    
    if inv:
        invoices = invoices.filter(invoice_number__icontains=inv)
    if client:
        invoices = invoices.filter(client_user__crm_profile__company_name__icontains=client)
    if status and status != "ALL":
        invoices = invoices.filter(status=status)

    invoices = invoices.order_by('-created_at')[:20]
    
    data = [
        LedgerItem(
            id=str(db_inv.invoice_number),
            client=db_inv.client_user.crm_profile.company_name if hasattr(db_inv.client_user, 'crm_profile') else "Unkown Client",
            date=db_inv.created_at.strftime("%b %d, %Y"),
            amount=f"EGP {float(db_inv.calculated_total or 0.0):,.2f}",
            status=str(db_inv.status),
            eta="Approved" if db_inv.eta_uuid else ("Pending" if db_inv.status == InvoiceStatus.SENT else "Not Submitted"),
            is_locked=db_inv.is_locked
        )
        async for db_inv in invoices
    ]
    
    return data

@app.patch("/ledger/{invoice_number}/status", tags=["Financials"])
async def update_invoice_status(invoice_number: str, payload: StatusUpdatePayload) -> LedgerItem:
    invoice = (
        await Invoice.objects.select_related("client_user")
        .annotate(
            calculated_total=Sum(
                F("items__quantity")
                * F("items__unit_price")
                * (1 + F("items__vat_rate"))
            )
        )
        .aget(invoice_number=invoice_number)
    )

    invoice.status = payload.status
    await invoice.asave(update_fields=["status"])

    return LedgerItem(
        id=str(invoice.invoice_number),
        client=invoice.client_user.email,
        date=invoice.created_at.strftime("%b %d, %Y"),
        amount=invoice.calculated_total,
        status=str(invoice.status),
        eta="Pending",
        is_locked=invoice.is_locked,
    )
    
    
def process_invoice_edit_sync(invoice_number: str, payload: InvoiceEditPayload) -> LedgerItem:
    with transaction.atomic():
        try:
            invoice = Invoice.objects.select_for_update().get(invoice_number=invoice_number)
        except Invoice.DoesNotExist:
            raise BadRequest(detail="Invoice not found.")

        # Enforce the lock
        if invoice.is_locked:
            raise BadRequest(detail="This invoice is legally locked and cannot be edited.")

        # Update parent details
        if payload.due_date:
            invoice.due_date = payload.due_date
            invoice.save(update_fields=["due_date"])

        # PREPARE THE DATA (O(N) Complexity using Dictionaries)
        incoming_updates = {item.id: item for item in payload.items if item.id is not None}
        new_items_payload = [item for item in payload.items if item.id is None]

        # A. Delete old items instantly
        invoice.items.exclude(id__in=incoming_updates.keys()).delete()

        # B. Process Updates efficiently
        items_to_edit: list[InvoiceItem] = []
        fields_to_edit: set[str] = set()
        
        for db_item in invoice.items.filter(id__in=incoming_updates.keys()):
            incoming = incoming_updates[db_item.id]
            
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
                
            items_to_edit.append(db_item)
            
        if items_to_edit and fields_to_edit:
            InvoiceItem.objects.bulk_update(items_to_edit, fields_to_edit, batch_size=500)
        
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

        # Recalculate using Database Aggregation
        revenue_calc = invoice.items.aggregate(
            total=Sum(F('quantity') * F('unit_price') * (1 + F('vat_rate')))
        )
        inv_total = float(revenue_calc['total'] or 0.0)

        # Extract related data
        company_name = "Unknown Client"
        try:
            profile = ClientProfile.objects.get(user_id=invoice.client_user.pk)
            company_name = profile.company_name
        except ClientProfile.DoesNotExist:
            pass

        eta_status = "Approved" if invoice.eta_uuid else ("Pending" if invoice.status == InvoiceStatus.SENT else "Not Submitted")

        return LedgerItem(
            id=str(invoice.invoice_number),
            client=company_name,
            date=invoice.created_at.strftime("%b %d, %Y"),
            amount=f"EGP {inv_total:,.2f}",
            status=str(invoice.status),
            eta=eta_status,
            is_locked=invoice.is_locked,
        )


@app.put("/ledger/{invoice_number}/edit", tags=["Financials"])
async def edit_invoice_api(invoice_number: str, payload: InvoiceEditPayload) -> LedgerItem:
    """Completely overwrites the invoice details and line items safely."""
    return await sync_to_async(process_invoice_edit_sync)(invoice_number, payload)


def process_invoice_create_sync(payload: InvoiceCreatePayload) -> str:
    with transaction.atomic():
        # 1. Validate the Client Entity
        try:
            client_user = ERPUser.objects.get(id=payload.clientId)
        except ERPUser.DoesNotExist:
            raise BadRequest(detail="The selected client does not exist in the CRM.")
        
        # 3. Create Parent Invoice Document
        invoice = Invoice.objects.create(
            client_user=client_user,
            due_date=payload.dueDate,
            status=InvoiceStatus.DRAFT,
            is_locked=False
        )
        
        items_to_create = [
            InvoiceItem(
                invoice=invoice,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unitPrice,
                vat_rate=item.vatRate
            )
            for item in payload.items
        ]
        
        InvoiceItem.objects.bulk_create(items_to_create, batch_size=500)
        
        return invoice.invoice_number

@app.post("/ledger/create", tags=["Financials"])
async def create_invoice_api(payload: InvoiceCreatePayload) -> InvoiceCreateResponse:
    """Creates a brand new invoice and its line items atomically."""
    
    if not payload.items:
        raise BadRequest(detail="An invoice must contain at least one line item.")
        
    invoice_serial = await sync_to_async(process_invoice_create_sync)(payload)
    
    return InvoiceCreateResponse(
        id=invoice_serial,
        message="Invoice draft generated successfully."
    )

@app.get("/crm", tags=["CRM"])
async def crm_api() -> list[CRMItem]:
    clients = ClientProfile.objects.all()

    data: list[CRMItem] = []

    async for client in clients:
        active_contract = await client.contracts.filter(is_active=True).afirst()

        data.append(
            CRMItem(
                id=client.pk,
                name=client.company_name,
                taxId=client.tax_registration_number,
                contract=(
                    active_contract.title if active_contract else "No Active Retainer"
                ),
                value=(
                    f"EGP {active_contract.total_value:,.2f}"
                    if active_contract
                    else "EGP 0.00"
                ),
                status="Active" if active_contract else "Review Pending",
            )
        )
    return data


@app.get("/crm/clients/lookup", tags=["CRM"])
async def client_lookup_api() -> list[ClientLookupOption]:
    """Lightweight endpoint to populate dropdowns in the frontend."""
    options = [
        ClientLookupOption(
            id=profile.pk,
            name=profile.company_name
        )
        async for profile in ClientProfile.objects.all().order_by('company_name')
    ]
        
    return options


@app.get("/hr", tags=["HR & Payroll"])
async def hr_api() -> list[HRItem]:
    staff = EmployeeProfile.objects.select_related("department", "user").aiterator()
    today = timezone.now().date()
    data: list[HRItem] = []

    async for emp in staff:
        log = await AttendanceLog.objects.filter(employee=emp, date=today).afirst()

        status_text = "Not Logged"
        if log:
            match log.status:
                case AttendanceStatus.PRESENT:
                    status_text = "Present"
                case x if x == AttendanceStatus.LATE and log.clock_in:
                    status_text = f"Late ({log.clock_in.strftime('%I:%M %p')})"
                case _:
                    status_text = "Absent"

        data.append(
            HRItem(
                id=f"EMP-{emp.pk:03d}",
                name=emp.user.username,
                role=emp.position,
                dept=emp.department.name,
                salary=f"EGP {emp.base_salary:,.2f}",
                status=status_text,
            )
        )
    return data
