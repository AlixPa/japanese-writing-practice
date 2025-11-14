from asgi_correlation_id.middleware import CorrelationIdMiddleware, is_valid_uuid4
from fastapi import FastAPI
from contextlib import asynccontextmanager

# from fastapi.middleware.cors import CORSMiddleware
from src.api import api_router
from src.config.env_var import ENV
from src.scripts.manage_dbfile_s3 import load_sqlite_file, save_sqlite_file
from src.config.runtime import service_env


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_sqlite_file()
    yield
    save_sqlite_file()


app = FastAPI(lifespan=lifespan)

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
