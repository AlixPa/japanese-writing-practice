from asgi_correlation_id.middleware import CorrelationIdMiddleware, is_valid_uuid4
from fastapi import FastAPI

# from fastapi.middleware.cors import CORSMiddleware
from src.api import api_router
from src.config.env_var import ENV
from src.config.runtime import service_env

app = FastAPI()

## NOTE: setup if deployment
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.include_router(api_router)

app.add_middleware(
    CorrelationIdMiddleware,
    header_name="X-Correlation-ID",
    update_request_header=True,
    validator=None if ENV == service_env.local else is_valid_uuid4,
)
