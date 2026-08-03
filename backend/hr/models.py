from decimal import Decimal
from django.db import models
from core.models import ERPUser

class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True) # e.g., "TAX", "AUDIT"
    manager = models.ForeignKey(
        ERPUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name="managed_departments"
    )

    def __str__(self) -> str:
        return self.name

class EmployeeProfile(models.Model):
    user = models.OneToOneField(
        ERPUser, 
        on_delete=models.CASCADE, 
        related_name="hr_profile"
    )
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    position = models.CharField(max_length=100) # e.g., "Senior Tax Auditor"
    national_id = models.CharField(max_length=14, unique=True) # Egyptian National ID length
    hire_date = models.DateField()
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.user.username} - {self.position}"

class AttendanceStatus(models.TextChoices):
    PRESENT = "PRESENT", "Present"
    ABSENT = "ABSENT", "Absent"
    LATE = "LATE", "Late"
    LEAVE = "LEAVE", "On Approved Leave"

class AttendanceLog(models.Model):
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name="attendance")
    date = models.DateField()
    clock_in = models.TimeField(blank=True, null=True)
    clock_out = models.TimeField(blank=True, null=True)
    status = models.CharField(max_length=15, choices=AttendanceStatus, default=AttendanceStatus.PRESENT)

    class Meta:
        unique_together = ('employee', 'date')
    
class PayrollPeriod(models.Model):
    month = models.PositiveIntegerField() # 1 - 12
    year = models.PositiveIntegerField()  # e.g., 2026
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('month', 'year')
        
    def __str__(self) -> str:
        return f"{self.year}-{self.month}"

class Payslip(models.Model):
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.PROTECT)
    period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name="payslips")
    
    # Precise calculation breakouts handled securely by Pandas on generation
    base_salary_snapshot = models.DecimalField(max_digits=12, decimal_places=2)
    bonuses = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Egyptian Social Insurance & Payroll Tax bracket extractions
    social_insurance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    income_tax_withheld = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ('employee', 'period')
