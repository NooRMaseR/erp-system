from typing import Any

from django_bolt.serializers import Serializer
from .models import ERPUserRole
from datetime import datetime
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


class AuditLogSerializer(msgspec.Struct):
    id: int
    username: str
    email: str
    action: str
    module: str
    date: str
    changes: dict[str, Any]

class ChartDataSerializer(msgspec.Struct):
    month: str
    revenue: float
    payroll: float

class DashboardStatsSerializer(msgspec.Struct):
    totalRevenue: float
    pendingReceivables: float
    totalPayroll: float
    activeClients: int
    chartData: list[ChartDataSerializer]