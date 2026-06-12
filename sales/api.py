import asyncio
from .models import Order
from django_bolt import BoltAPI
from .serializers import OrderSerializer

app = BoltAPI(
    prefix="/sales"
)

@app.get("/orders")
async def get_orders() -> list[OrderSerializer]:
    qs = Order.objects.select_related("customer").prefetch_related("order_items__product")
    data = [OrderSerializer.afrom_model(product) async for product in qs]
    return await asyncio.gather(*data)