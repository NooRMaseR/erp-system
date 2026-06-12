from django_bolt.serializers import Serializer

class ProductsSerializer(Serializer):
    name: str
    price: float
    quantity: int