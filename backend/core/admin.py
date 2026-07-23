from django.contrib import admin
from unfold.admin import ModelAdmin
from core.models import ERPUser, AuditTrail
from django.contrib.auth.models import Group
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from unfold.contrib.filters.admin.choice_filters import ChoicesCheckboxFilter

# Register your models here.
admin.site.unregister(Group)

@admin.register(ERPUser)
class UserAdmin(ModelAdmin):
    list_display = ("id", "username", "email", "phone_number", "role")
    list_display_links = ("id", "username", "email")
    list_filter = (
        ("role", ChoicesCheckboxFilter),
    )
    list_filter_submit = True
    search_fields = ("username", "email", "phone_number")
    search_help_text = "Search by (email, phone, username)"


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass

@admin.register(AuditTrail)
class AuditTrailAdmin(ModelAdmin):
    list_display = ["timestamp", "user", "action", "module", "row_id"]
    list_filter = ["module", "timestamp"]
    search_fields = ["action", "user__username", "module"]
    
    readonly_fields = ["user", "action", "module", "row_id", "changes", "timestamp"]

    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None): return False