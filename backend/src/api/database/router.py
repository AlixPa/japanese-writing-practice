from fastapi import APIRouter, status
from src.logger import get_logger
from src.scripts.manage_dbfile_s3 import load_sqlite_file

router = APIRouter(prefix="/database")
logger = get_logger()


@router.post("/reload", status_code=status.HTTP_204_NO_CONTENT)
async def reload_db(custom_file_name: str | None = None) -> None:
    logger.info(f"On POST /database/reload")
    load_sqlite_file(custom_file_name)

    return
