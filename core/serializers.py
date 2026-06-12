from django_bolt.serializers import Serializer
from .models import ERPUserRole
from datetime import datetime

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

class CustomerSerializer(Serializer):
    id: int
    username: str