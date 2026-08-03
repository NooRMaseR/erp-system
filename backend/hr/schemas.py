from django_bolt.serializers import Email, Password, Phone
from datetime import date
import msgspec

class CreateEmployeeRequest(msgspec.Struct):
    fullName: str
    nationalId: int
    departmentId: int
    position: str
    baseSalary: float
    hireDate: date
    email: Email
    phone: Phone
    password: Password

class ProcessPayrollRequest(msgspec.Struct):
    month: int
    year: int