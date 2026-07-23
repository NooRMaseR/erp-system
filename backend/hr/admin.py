from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Department, EmployeeProfile, AttendanceLog

@admin.register(Department)
class DepartmentAdmin(ModelAdmin):
    list_display = ["name", "code", "manager"]
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
