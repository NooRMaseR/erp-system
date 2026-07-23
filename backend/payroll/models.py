from decimal import Decimal
from django.db import models
from hr.models import EmployeeProfile

class PayrollPeriod(models.Model):
    month = models.PositiveIntegerField() # 1 - 12
    year = models.PositiveIntegerField()  # e.g., 2026
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('month', 'year')

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
