from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import ClientProfile, CorporateContract

class CorporateContractInline(TabularInline):
    model = CorporateContract
    extra = 1

@admin.register(ClientProfile)
class ClientProfileAdmin(ModelAdmin):
    list_display = ["company_name", "user", "tax_registration_number", "commercial_register_id"]
    search_fields = ["company_name", "tax_registration_number", "commercial_register_id"]
    inlines = [CorporateContractInline]