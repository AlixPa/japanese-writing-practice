from asgi_correlation_id.middleware import CorrelationIdMiddleware, is_valid_uuid4
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

# from fastapi.middleware.cors import CORSMiddleware
from .api import api_router
from .config.env_var import ENV
from .config.path import path_config
from .scripts.manage_dbfile_s3 import load_sqlite_file, save_sqlite_file
from .config.runtime import service_env


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_sqlite_file()
    yield
    save_sqlite_file()


app = FastAPI(lifespan=lifespan)

# Serving front from back for reduced render's costs
app.mount(
    "/assets", StaticFiles(directory=path_config.front_dist / "assets"), name="assets"
)


@app.get("/")
async def serve_frontend():
    return FileResponse(path_config.front_dist / "index.html")


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
