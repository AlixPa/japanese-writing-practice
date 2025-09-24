import aiofiles
from src.clients.mysql import AMysqlClientReader, AMySqlIdNotFoundError
from src.config.runtime import STATIC_PATH
from src.exceptions.http import WrongArgumentException
from src.logger import get_logger
from src.models.database import (
    AudioTable,
    StoryAudioTable,
    StoryChunkAudioTable,
    StoryChunkTable,
    StoryTable,
)

from .models import AudioMetadata

logger = get_logger()


async def load_metadata(story_id: str, speed: int) -> AudioMetadata:
    mysql_reader = AMysqlClientReader(logger)

    try:
        story = await mysql_reader.select_by_id(table=StoryTable, id=story_id)
    except AMySqlIdNotFoundError:
        raise WrongArgumentException(f"no story found for {story_id=}")

    story_audios = await mysql_reader.select(
        table=StoryAudioTable, cond_equal=dict(storyId=story_id, speedPercentage=speed)
    )
    if not story_audios:
        raise WrongArgumentException(f"no audio for {story_id=}, {speed=}")
    story_audio = story_audios[0]

    return AudioMetadata(audio_text=story.text, audio_id=story_audio.audioId)


async def load_sentence_metadata(story_id: str, speed: int) -> list[AudioMetadata]:
    mysql_reader = AMysqlClientReader(logger)

    if not await mysql_reader.id_exists(table=StoryTable, id=story_id):
        raise WrongArgumentException(f"no story found for {story_id=}")

    story_chunks = await mysql_reader.select(
        table=StoryChunkTable,
        cond_equal=dict(
            storyId=story_id,
        ),
    )
    if not story_chunks:
        raise WrongArgumentException(f"no story chunks for {story_id=}")
    story_chunks.sort(key=lambda sc: sc.position)

    story_chunks_audio = await mysql_reader.select(
        table=StoryChunkAudioTable,
        cond_equal=dict(speedPercentage=speed),
        cond_in=dict(storyChunkId=[s.id for s in story_chunks]),
    )
    if not story_chunks_audio:
        raise WrongArgumentException(f"no audio chunks for {story_id=}, {speed=}")
    chunk_id_to_audio_id_map = {
        sca.storyChunkId: sca.audioId for sca in story_chunks_audio
    }
    if len(chunk_id_to_audio_id_map) != len(story_chunks):
        raise Exception(f"missing audio chunks compared to the story chunks")

    return [
        AudioMetadata(
            audio_text=sc.text,
            audio_id=chunk_id_to_audio_id_map[sc.id],
        )
        for sc in story_chunks
    ]


async def load_audio_bytes(audio_id: str) -> bytes:
    mysql_reader = AMysqlClientReader(logger)
    try:
        audio = await mysql_reader.select_by_id(table=AudioTable, id=audio_id)
    except AMySqlIdNotFoundError:
        raise WrongArgumentException(f"no audio found for {audio_id=}")
    audio_relative_path = audio.url

    ## TODO: For now all is local, adapt here if files are stored on S3 or else
    async with aiofiles.open(STATIC_PATH.AUDIO / audio_relative_path, "rb") as f:
        audio_bytes = await f.read()

    return audio_bytes
