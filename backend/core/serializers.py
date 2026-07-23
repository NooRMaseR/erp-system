from django_bolt.serializers import Serializer
from .models import ERPUserRole
from datetime import date, datetime
import msgspec

class UserSerializer(Serializer):
    id: int
    username: str
    email: str
    phone_number: str
    role: ERPUserRole
    is_active: bool
    is_staff: bool
    created_at: datetime
    updated_at: datetime


class DashboardResponse(msgspec.Struct):
    totalRevenue: str
    growth: str
    activeClients: int
    pendingInvoices: int

class LedgerItem(msgspec.Struct):
    id: str
    client: str
    date: str
    amount: str
    status: str
    eta: str
    is_locked: bool

class CRMItem(msgspec.Struct):
    id: int
    name: str
    taxId: str
    contract: str
    value: str
    status: str

class HRItem(msgspec.Struct):
    id: str
    name: str
    role: str
    dept: str
    salary: str
    status: str

class InvoiceItemPayload(msgspec.Struct):
    description: str
    quantity: int
    unit_price: float
    vat_rate: float
    id: int | None = None

class InvoiceItemCreate(msgspec.Struct):
    description: str
    quantity: int
    unitPrice: float
    vatRate: float

class InvoiceCreatePayload(msgspec.Struct):
    clientId: str
    dueDate: date
    items: list[InvoiceItemCreate]

class InvoiceCreateResponse(msgspec.Struct):
    id: str
    message: str
    
class ClientLookupOption(msgspec.Struct):
    id: int
    name: str