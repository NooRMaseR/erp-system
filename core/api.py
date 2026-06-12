from django_bolt import BoltAPI, OpenAPIConfig

app = BoltAPI(
    openapi_config=OpenAPIConfig(
        title="ERP System",
        version="0.1"
    )
)
