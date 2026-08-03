from django_bolt.auth import Requires
from .models import ERPUserRole


IsClient = Requires("role", ERPUserRole.CLIENT)
AreAdmins = Requires("role", ERPUserRole.SUPER_ADMIN, ERPUserRole.MANAGER)
"Requires `SUPER_ADMIN` or `MANAGER`"
IsNotClient = Requires("role", ERPUserRole.SUPER_ADMIN, ERPUserRole.EMPLOYEE, ERPUserRole.MANAGER)
