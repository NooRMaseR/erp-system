from django.db import models
from core.models import ERPUser

class ClientProfile(models.Model):
    """Extends basic user login entities to carry business profile records."""
    user = models.OneToOneField(
        ERPUser,
        on_delete=models.CASCADE,
        related_name="crm_profile"
    )
    company_name = models.CharField(max_length=200)
    
    # Crucial field: Egyptian Tax Registration Number (9 digits) for e-Invoicing
    tax_registration_number = models.CharField(max_length=9, unique=True)
    commercial_register_id = models.CharField(max_length=50, blank=True, null=True)
    company_address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.company_name

class CorporateContract(models.Model):
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="contracts")
    title = models.CharField(max_length=150) # e.g., "Annual Auditing Retainer 2026"
    contract_file = models.FileField(upload_to="contracts/", blank=True, null=True) # Document management file target
    start_date = models.DateField()
    end_date = models.DateField()
    total_value = models.DecimalField(max_digits=14, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.title} - {self.client.company_name}"
