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
        kwargs.setdefault("role", ERPUserRole.STAFF)
        kwargs.setdefault("is_active", True)
        kwargs.setdefault("is_superuser", True)
        
        if not kwargs.get("is_staff"):
            raise ValueError("is_staff must be True")
        
        if not kwargs.get("is_superuser"):
            raise ValueError("is_superuser must be True")
        
        return self.create_user(username, email, password, **kwargs)
        

class ERPUserRole(models.TextChoices):
    STAFF = "staff", "Staff"
    CUSTOMER = "customer", "Customer"


class ERPUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    role = models.CharField(max_length=10, choices=ERPUserRole, default=ERPUserRole.CUSTOMER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self) -> str:
        return self.email
