from fastapi import APIRouter

from .audio import audio_router
from .config import config_router
from .database import database_router
from .story import story_router

router = APIRouter(prefix="/api")

router.include_router(audio_router)
router.include_router(config_router)
router.include_router(database_router)
router.include_router(story_router)
