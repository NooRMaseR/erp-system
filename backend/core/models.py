from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

# Create your models here.

class UserManager(BaseUserManager):
    def create_user(self, username: str, email: str, password: str, **kwargs) -> ERPUser:
        if not username:
            raise ValueError("username is required")
        
        if not email:
            raise ValueError("email is required")
        
        if not password:
            raise ValueError("password is required")
        
        email = self.normalize_email(email)
        user: ERPUser = self.model(username=username, email=email, **kwargs)
        user.set_password(password)
        user.save(using=self._db)
        
        return user
    
    def create_superuser(self, username: str, email: str, password: str, **kwargs) -> ERPUser:
        kwargs.setdefault("is_staff", True)
        kwargs.setdefault("role", ERPUserRole.SUPER_ADMIN)
        kwargs.setdefault("is_active", True)
        kwargs.setdefault("is_superuser", True)
        
        if not kwargs.get("is_staff"):
            raise ValueError("is_staff must be True")
        
        if not kwargs.get("is_superuser"):
            raise ValueError("is_superuser must be True")
        
        return self.create_user(username, email, password, **kwargs)
        
class ERPUserRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    MANAGER = "MANAGER", "Manager"
    EMPLOYEE = "EMPLOYEE", "Firm Employee"
    CLIENT = "CLIENT", "Client Portal User"
    
class ERPUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=ERPUserRole, default=ERPUserRole.EMPLOYEE)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self) -> str:
        return self.email

class AuditTrail(models.Model):
    """Logs every critical business action for regulatory compliance."""
    user = models.ForeignKey(ERPUser, on_delete=models.PROTECT)
    action = models.CharField(max_length=255)  # e.g., "Created Invoice", "Approved Leave"
    module = models.CharField(max_length=100) # e.g., "Financials", "HR"
    row_id = models.PositiveIntegerField(null=True)
    changes = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
