from enum import StrEnum
from typing import Literal

from django_bolt.serializers import Email, Phone, PositiveInt, Serializer, field_validator
import msgspec

from financials.models import InvoiceStatus

class ClientLookupOption(msgspec.Struct):
    id: PositiveInt
    name: str

class CreateClientResponse(msgspec.Struct):
    message: str
    clientId: PositiveInt
    userId: PositiveInt
    
class ClientStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class CrmClientResponse(msgspec.Struct):
    id: PositiveInt
    companyName: str
    taxRegistration: str
    contactEmail: Email
    phone: str
    status: ClientStatus
    daysActive: int
    registeredDate: str

class CreateClientRequest(Serializer):
    companyName: str
    taxRegistration: int
    commercialRegister: str
    companyAddress: str
    contactEmail: Email
    phone: Phone
    password: str
    
    # التأكد من أن الرقم الضريبي 9 أرقام (حماية مسبقة قبل قاعدة البيانات)
    @field_validator("taxRegistration") # type: ignore
    def validate_tax_registration(cls, value: int) -> int:
        if len(str(value)) != 9:
            raise ValueError("رقم التسجيل الضريبي يجب أن يكون 9 أرقام بالضبط للتوافق مع الفاتورة الإلكترونية.")
        return value

class ClientInvoiceResponse(msgspec.Struct):
    id: int
    invoice_number: str
    date: str
    amount: float
    status: InvoiceStatus
