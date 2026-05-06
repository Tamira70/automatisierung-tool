from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "priority", "due_date", "created_by", "created_at")
    search_fields = ("title", "description")
    list_filter = ("status", "priority", "due_date", "created_at", "created_by")