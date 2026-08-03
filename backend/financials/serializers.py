from datetime import date
from enum import StrEnum
from financials.models import InvoiceStatus
import msgspec

class LedgerItem(msgspec.Struct):
    id: str
    client: str
    date: str
    amount: str
    status: InvoiceStatus
    eta: str
    is_locked: bool

class InvoiceItemCreate(msgspec.Struct):
    description: str
    quantity: int
    unitPrice: float
    vatRate: float

class InvoiceCreatePayload(msgspec.Struct):
    clientId: int
    dueDate: date
    items: list[InvoiceItemCreate]

class InvoiceCreateResponse(msgspec.Struct):
    id: str
    message: str
    
class PayrollStatus(StrEnum):
    PAID = "PAID"
    PENDING = "PENDING"

class PayrollLedgerSerializer(msgspec.Struct):
    id: str
    month: str
    employeesCount: int
    totalNetSalaries: float
    status: PayrollStatus