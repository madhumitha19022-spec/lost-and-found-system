from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Item


class ItemAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("item-list")
        self.valid_payload = {
            "item_name": "Blue Water Bottle",
            "category": "Other",
            "status": "Lost",
            "location": "Library, 2nd floor",
            "date": "2026-09-10",
            "description": "Steel bottle with a college sticker.",
            "contact_name": "Test Student",
            "contact_email": "test@example.com",
        }

    def test_create_item_success(self):
        response = self.client.post(self.list_url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Item.objects.count(), 1)

    def test_create_item_invalid_status(self):
        payload = dict(self.valid_payload, status="Missing")
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_invalid_email(self):
        payload = dict(self.valid_payload, contact_email="not-an-email")
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_missing_required_field(self):
        payload = dict(self.valid_payload)
        payload.pop("item_name")
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_items(self):
        Item.objects.create(**{**self.valid_payload})
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_item(self):
        item = Item.objects.create(**self.valid_payload)
        detail_url = reverse("item-detail", args=[item.id])
        response = self.client.put(detail_url, dict(self.valid_payload, item_name="Updated Name"), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.item_name, "Updated Name")

    def test_delete_item(self):
        item = Item.objects.create(**self.valid_payload)
        detail_url = reverse("item-detail", args=[item.id])
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Item.objects.count(), 0)

    def test_retrieve_nonexistent_item(self):
        detail_url = reverse("item-detail", args=[9999])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
