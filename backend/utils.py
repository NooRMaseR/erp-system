from django.db.models import Sum, F, DecimalField
from django.db.models.manager import BaseManager
from sales.models import Order


def get_orders_queryset(select_related = True, prefetch_related = True) -> BaseManager[Order]:
    "A QuerySet that returns `Order` model along with (`customer`, `order_items__product`) and extra field `total`"
    qs = (
        Order.objects
        .annotate(
            total=Sum(
                F('order_items__product__price') * F("order_items__quantity"),
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        )
    )
    
    if select_related:
        qs = qs.select_related("customer")
        
    if prefetch_related:
        qs = qs.prefetch_related("order_items__product")
    
    return qs
