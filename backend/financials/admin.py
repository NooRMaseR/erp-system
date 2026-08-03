from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Invoice, InvoiceItem

class InvoiceItemInline(TabularInline):
    model = InvoiceItem
    extra = 1
    fields = ["description", "quantity", "unit_price", "vat_rate"]

@admin.register(Invoice)
class InvoiceAdmin(ModelAdmin):
    list_display = ["invoice_number", "client_user", "created_at", "due_date", "status", "is_locked"]
    list_filter = ["status", "is_locked", "created_at"]
    search_fields = ["invoice_number", "client_user__username", "eta_uuid"]
    inlines = [InvoiceItemInline]
    
    # Lock down fields if the invoice has already been submitted or locked
    readonly_fields = ["invoice_number", "eta_uuid"]
    warn_unsaved_form = True # Notifies the user if they try to leave without saving
