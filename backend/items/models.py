from django.db import models


class Item(models.Model):
    """A lost or found item reported on campus."""

    class Status(models.TextChoices):
        LOST = "Lost", "Lost"
        FOUND = "Found", "Found"

    class Category(models.TextChoices):
        ELECTRONICS = "Electronics", "Electronics"
        DOCUMENTS = "Documents", "Documents"
        ACCESSORIES = "Accessories", "Accessories"
        BOOKS_STATIONERY = "Books & Stationery", "Books & Stationery"
        CLOTHING = "Clothing", "Clothing"
        BAGS = "Bags", "Bags"
        ID_CARDS = "ID Cards", "ID Cards"
        KEYS = "Keys", "Keys"
        OTHER = "Other", "Other"

    item_name = models.CharField(max_length=150)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.OTHER)
    status = models.CharField(max_length=10, choices=Status.choices)
    location = models.CharField(max_length=150)
    date = models.DateField(help_text="Date the item was lost or found")
    description = models.TextField(blank=True)
    contact_name = models.CharField(max_length=100)
    contact_email = models.EmailField()
    image = models.ImageField(upload_to="items/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.status}] {self.item_name}"
