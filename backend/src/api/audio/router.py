from fastapi import APIRouter, Response
from src.exceptions.http import HTTPWrongAttributesException, WrongArgumentException
from src.logger import get_logger

from .models import AudioMetadata
from .service import load_audio_bytes, load_metadata, load_sentence_metadata

router = APIRouter(prefix="/audio")
logger = get_logger()


@router.get("/metadata", response_model=AudioMetadata)
async def get_metadata(story_id: str, speed: int) -> AudioMetadata:
    logger.info(f"On GET /audio/metadata with {story_id=}, {speed=}")

    try:
        return await load_metadata(story_id=story_id, speed=speed)
    except WrongArgumentException as e:
        raise HTTPWrongAttributesException(str(e))


@router.get("/metadata/sentence", response_model=list[AudioMetadata])
async def get_sentence_metadata(story_id: str, speed: int) -> list[AudioMetadata]:
    logger.info(f"On GET /audio/metadata/sentence with {story_id=}, {speed=}")

    try:
        return await load_sentence_metadata(story_id=story_id, speed=speed)
    except WrongArgumentException as e:
        raise HTTPWrongAttributesException(str(e))


@router.get("/{filename}", response_class=Response)
async def get_audio(filename: str):
    logger.info(f"On GET /audio/{{filename}} with {filename=}")
    audio_bytes = await load_audio_bytes(filename)
    return Response(content=audio_bytes, media_type="audio/wav")
