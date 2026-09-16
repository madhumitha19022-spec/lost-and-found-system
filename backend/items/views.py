from rest_framework import viewsets, status as http_status
from rest_framework.response import Response

from .models import Item
from .serializers import ItemSerializer
from .filters import ItemFilter


class ItemViewSet(viewsets.ModelViewSet):
    """
    Full CRUD API for lost & found items.

    list:    GET    /api/items/
    create:  POST   /api/items/
    detail:  GET    /api/items/{id}/
    update:  PUT    /api/items/{id}/
    partial: PATCH  /api/items/{id}/
    delete:  DELETE /api/items/{id}/

    Query params on list:
        ?search=<text>          searches item_name, description, location
        ?category=<Category>
        ?status=<Lost|Found>
        ?ordering=date | -date | created_at | -created_at
    """

    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    filterset_class = ItemFilter
    search_fields = ["item_name", "description", "location"]
    ordering_fields = ["date", "created_at", "item_name"]
    ordering = ["-created_at"]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        self.perform_create(serializer)
        return Response(
            {"success": True, "message": "Item reported successfully.", "data": serializer.data},
            status=http_status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        self.perform_update(serializer)
        return Response(
            {"success": True, "message": "Item updated successfully.", "data": serializer.data}
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        item_name = instance.item_name
        self.perform_destroy(instance)
        return Response(
            {"success": True, "message": f'"{item_name}" was deleted successfully.'},
            status=http_status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except Item.DoesNotExist:
            return Response(
                {"success": False, "message": "Item not found."},
                status=http_status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(instance)
        return Response({"success": True, "data": serializer.data})
