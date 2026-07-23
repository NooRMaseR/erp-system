from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import PayrollPeriod, Payslip

class PayslipInline(TabularInline):
    model = Payslip
    extra = 0
    readonly_fields = ["employee", "base_salary_snapshot", "bonuses", "deductions", "social_insurance", "income_tax_withheld", "net_salary"]

@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(ModelAdmin):
    list_display = ["year", "month", "is_processed", "processed_at"]
    list_filter = ["is_processed", "year"]
    inlines = [PayslipInline]

@admin.register(Payslip)
class PayslipAdmin(ModelAdmin):
    list_display = ["employee", "period", "base_salary_snapshot", "net_salary"]
    list_filter = ["period__year", "period__month"]
    search_fields = ["employee__user__first_name", "employee__user__last_name"]