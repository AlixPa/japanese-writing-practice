from fastapi import APIRouter
from src.logger import get_logger

from .models import StoryMetadata
from .service import load_wanikani_stories

router = APIRouter(prefix="/story")
logger = get_logger()


@router.get("/wanikani", response_model=list[StoryMetadata])
async def get_stories(level: int) -> list[StoryMetadata]:
    logger.info(f"On GET /wanikani with {level=}")

    return await load_wanikani_stories(level)
