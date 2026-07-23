from django_bolt.serializers import Email, Password, Serializer
from .serializers import InvoiceItemPayload
from financials.models import InvoiceStatus
from datetime import date
import msgspec

class LoginRequest(msgspec.Struct):
    email: Email
    password: Password

class LoginResponse(Serializer):
    email: Email
    username: str
    token: str

class StatusUpdatePayload(msgspec.Struct):
    status: InvoiceStatus

class InvoiceEditPayload(msgspec.Struct):
    due_date: date | None = None
    items: list[InvoiceItemPayload] = []
