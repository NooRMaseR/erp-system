from django.db import models
from core.models import ERPUser
from inventory.models import Product

# Create your models here.

class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    DELIVERED = "delivered", "Delivered"

class Order(models.Model):
    customer = models.ForeignKey(ERPUser, models.CASCADE, related_name="orders")
    status = models.CharField(max_length=10, choices=OrderStatus, default=OrderStatus.PENDING)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, models.CASCADE, related_name="order_items")
    product = models.ForeignKey(Product, models.PROTECT, related_name="buyers")
    quantity = models.PositiveIntegerField(default=1)
