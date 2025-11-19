import asyncio
import contextlib

from asgi_correlation_id.middleware import CorrelationIdMiddleware, is_valid_uuid4
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# from fastapi.middleware.cors import CORSMiddleware
from .api import api_router
from .config.env_var import ENV
from .config.path import path_config
from .config.runtime import USES_LOCAL_FILES, service_env
from .scripts.manage_dbfile_s3 import load_sqlite_file, save_sqlite_file


async def periodic_backup():
    while True:
        try:
            # 5 min syncup
            await asyncio.sleep(300)
        except asyncio.CancelledError:
            break
        await asyncio.to_thread(save_sqlite_file)


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    if USES_LOCAL_FILES:
        yield
    else:
        await asyncio.to_thread(load_sqlite_file)
        task = asyncio.create_task(periodic_backup())
        try:
            yield
        finally:
            task.cancel()
            with contextlib.suppress(Exception):
                await task
            await asyncio.to_thread(save_sqlite_file)


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
