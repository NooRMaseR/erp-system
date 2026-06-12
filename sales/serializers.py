from inventory.serializers import ProductsSerializer
from django_bolt.serializers import Serializer
from core.serializers import CustomerSerializer
from .models import OrderStatus

class OrderItemSerializer(Serializer):
    order: int
    product: ProductsSerializer
    quantity: int

class OrderSerializer(Serializer):
    customer: CustomerSerializer
    status: OrderStatus
    order_items: list[OrderItemSerializer]
