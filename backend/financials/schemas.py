from .models import InvoiceStatus
from datetime import date
import msgspec

class InvoiceItemPayload(msgspec.Struct):
    description: str
    quantity: int
    unit_price: float
    vat_rate: float
    id: int | None = None

class InvoiceEditPayload(msgspec.Struct):
    due_date: date | None = None
    items: list[InvoiceItemPayload] = []

class StatusUpdatePayload(msgspec.Struct):
    status: InvoiceStatus

class InvoiceItemCreate(msgspec.Struct):
    description: str
    quantity: int
    unitPrice: float
    vatRate: float