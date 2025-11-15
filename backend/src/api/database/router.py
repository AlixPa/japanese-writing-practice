from fastapi import APIRouter
from src.logger import get_logger
from src.scripts.manage_dbfile_s3 import load_sqlite_file

router = APIRouter(prefix="/database")
logger = get_logger()


@router.get("")
async def reload_db() -> None:
    logger.info(f"On GET /database")
    load_sqlite_file()
