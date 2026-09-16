from datetime import date as date_cls

from rest_framework import serializers

from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = [
            "id",
            "item_name",
            "category",
            "status",
            "location",
            "date",
            "description",
            "contact_name",
            "contact_email",
            "image",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    # ---- field-level validation -----------------------------------------
    def validate_item_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Item name cannot be empty.")
        return value.strip()

    def validate_location(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Location cannot be empty.")
        return value.strip()

    def validate_contact_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Contact name cannot be empty.")
        return value.strip()

    def validate_status(self, value):
        valid = [choice[0] for choice in Item.Status.choices]
        if value not in valid:
            raise serializers.ValidationError(
                f"Status must be one of {valid}."
            )
        return value

    def validate_date(self, value):
        if value > date_cls.today():
            raise serializers.ValidationError("Date cannot be in the future.")
        return value

    # contact_email is a serializers.EmailField (via ModelSerializer mapping
    # of models.EmailField) so invalid email formats are rejected automatically.
