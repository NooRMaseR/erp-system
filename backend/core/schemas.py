from django_bolt.serializers import Email, Password, Serializer
from .models import ERPUserRole
import msgspec

class LoginRequest(msgspec.Struct):
    email: Email
    password: Password
    
class TokensResponse(msgspec.Struct):
    access_token: str
    refresh_token: str

class LoginResponse(Serializer):
    email: Email
    username: str
    tokens: TokensResponse
    role: ERPUserRole

