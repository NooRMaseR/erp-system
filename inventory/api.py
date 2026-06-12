import asyncio
from .models import Product
from django_bolt import BoltAPI
from .serializers import ProductsSerializer

app = BoltAPI(
    prefix="/inventory"
)


@app.get("/products")
async def get_products() -> list[ProductsSerializer]:
    qs = Product.objects.all()
    data = [ProductsSerializer.afrom_model(product) async for product in qs]
    return await asyncio.gather(*data)
