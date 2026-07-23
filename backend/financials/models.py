from decimal import Decimal
from django.db import models
from core.models import ERPUser
from django.utils import timezone
from django.core.exceptions import ValidationError

class InvoiceStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft Ledger"
    SENT = "SENT", "Sent to Client"
    PAID = "PAID", "Settled / Paid"
    CANCELLED = "CANCELLED", "Voided / Cancelled"

class Invoice(models.Model):
    """Acts as the firm billings registry or client service log."""
    client_user = models.ForeignKey(
        ERPUser, 
        on_delete=models.PROTECT, 
        related_name="client_invoices"
    )
    invoice_number = models.CharField(max_length=50, unique=True, blank=True, editable=False) # e.g., INV-2026-0001
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    status = models.CharField(max_length=15, choices=InvoiceStatus, default=InvoiceStatus.DRAFT)
    
    # Audit lockdown flag - locks the record from mutations once finalized
    is_locked = models.BooleanField(default=False)
    
    # ETA Integration reference tokens (for Phase 4 e-Invoice submissions)
    eta_uuid = models.CharField(max_length=100, blank=True, null=True, unique=True)
    
    def clean(self) -> None:
        """Enforces strict accounting rules before saving."""
        super().clean()
        
        # If this is an existing invoice (not a brand new one)
        if self.pk is not None:
            # Fetch the original state directly from the database
            original = Invoice.objects.get(pk=self.pk)
            
            # RULE 1: Automatically lock the invoice if it leaves DRAFT or gets an ETA UUID
            if self.status != InvoiceStatus.DRAFT or self.eta_uuid:
                self.is_locked = True
            
            # RULE 2: If the invoice was ALREADY locked in the database, prevent core field mutations
            if original.is_locked:
                # Block changing the assigned client
                if self.client_user.pk != original.client_user.pk:
                    raise ValidationError("Cannot change the client on a locked, legally binding invoice.")
                
                # Block reverting a finalized status back to Draft
                if self.status == 'DRAFT':
                    raise ValidationError("Cannot revert a locked invoice back to Draft status.")
                
                # Block tampering with the government UUID
                if original.eta_uuid and self.eta_uuid != original.eta_uuid:
                    raise ValidationError("Tampering with an existing ETA UUID is strictly prohibited.")
    
    def save(self, *args, **kwargs) -> None:
        self.clean()
        IS_NEW = self.pk is None
        super().save(*args, **kwargs)
        
        if not IS_NEW:
            return
            
        self.invoice_number = f"INV-{timezone.now().year}-{self.pk:04d}"
        return super().save(update_fields=['invoice_number'])

    def __str__(self) -> str:
        return self.invoice_number

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255) # e.g., "Corporate Tax Filing Service Q2"
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Egyptian standard VAT rate is typically 14% (0.14)
    vat_rate = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0.14')) 

    @property
    def subtotal(self) -> Decimal:
        return self.quantity * self.unit_price

    @property
    def vat_amount(self) -> Decimal:
        return self.subtotal * self.vat_rate

    @property
    def total_cost(self) -> Decimal:
        return self.subtotal + self.vat_amount
