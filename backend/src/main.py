from contextlib import asynccontextmanager

from asgi_correlation_id.middleware import CorrelationIdMiddleware, is_valid_uuid4
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

# from fastapi.middleware.cors import CORSMiddleware
from .api import api_router
from .config.env_var import ENV
from .config.path import path_config
from .config.runtime import USES_LOCAL_FILES, service_env
from .scripts.manage_dbfile_s3 import load_sqlite_file


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not USES_LOCAL_FILES:
        load_sqlite_file()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(api_router)

# Serving front from back for reduced render's costs
app.mount(
    "/assets", StaticFiles(directory=path_config.front_dist / "assets"), name="assets"
)


@app.get("/{full_path:path}")
async def serve_frontend(request: Request, full_path: str):
    return FileResponse(path_config.front_dist / "index.html")


app.add_middleware(
    CorrelationIdMiddleware,
    header_name="X-Correlation-ID",
    update_request_header=True,
    validator=None if ENV == service_env.local else is_valid_uuid4,
)

## NOTE: setup if deployment
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
