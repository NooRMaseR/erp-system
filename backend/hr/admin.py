from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Department, EmployeeProfile, AttendanceLog, PayrollPeriod, Payslip

@admin.register(Department)
class DepartmentAdmin(ModelAdmin):
    list_display = ["id", "name", "code", "manager"]
    search_fields = ["name", "code"]
    compressed_fields = True # Unfold layout optimization

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(ModelAdmin):
    list_display = ["user", "department", "position", "hire_date", "base_salary", "is_active"]
    list_filter = ["department", "is_active", "hire_date"]
    search_fields = ["user__first_name", "user__last_name", "position", "national_id"]

@admin.register(AttendanceLog)
class AttendanceLogAdmin(ModelAdmin):
    list_display = ["date", "employee", "clock_in", "clock_out", "status"]
    list_filter = ["status", "date", "employee__department"]
    search_fields = ["employee__user__first_name", "employee__user__last_name"]

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
