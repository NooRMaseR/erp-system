from django_bolt.serializers import Email, Serializer
from .models import AttendanceStatus
import msgspec


class EmployeeHROption(msgspec.Struct):
    id: int
    fullName: str
    email: Email
    position: str
    department: str
    nationalId: str
    todayStatus: AttendanceStatus
    clockIn: str | None

class HRDashboardResponse(msgspec.Struct):
    totalEmployees: int
    presentToday: int
    onLeave: int
    absentToday: int
    employees: list[EmployeeHROption]

class ProcessPayrollResponse(msgspec.Struct):
    message: str
    processedCount: int
    totalNetSalary: float

class CreateEmployeeResponse(msgspec.Struct):
    message: str
    employeeId: str
    
class DepartmentSerializer(Serializer):
    id: int
    name: str
    code: str
