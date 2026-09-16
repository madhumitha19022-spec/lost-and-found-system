from django.contrib import admin

from .models import Item


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("id", "item_name", "category", "status", "location", "date", "contact_name", "created_at")
    list_filter = ("status", "category")
    search_fields = ("item_name", "description", "location", "contact_name", "contact_email")
    ordering = ("-created_at",)
