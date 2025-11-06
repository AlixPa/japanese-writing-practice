import aiofiles
from src.clients.aws import S3Client
from src.clients.mysql import AMysqlClientReader, AMySqlIdNotFoundError
from src.config.env_var import S3Buckets
from src.config.runtime import USES_LOCAL_FILES, path_config
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


## TODO: async
def get_audio_url(audio_url: str) -> str:
    if USES_LOCAL_FILES:
        return f"/api/audio/{audio_url}"

    s3 = S3Client()
    try:
        return s3.presigned_url(
            bucket=S3Buckets.japanese_dictation, prefix="audio", filename=audio_url
        )
    finally:
        s3.close()


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

    audio = await mysql_reader.select_by_id(
        table=AudioTable, id=story_audios[0].audioId
    )

    return AudioMetadata(audio_text=story.text, audio_url=get_audio_url(audio.url))


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

    audios = await mysql_reader.select(
        table=AudioTable, cond_in=dict(id=[sca.audioId for sca in story_chunks_audio])
    )
    audio_id_to_url_map = {a.id: get_audio_url(a.url) for a in audios}
    chunk_id_to_audio_url_map = {
        sca.storyChunkId: audio_id_to_url_map[sca.audioId] for sca in story_chunks_audio
    }
    if len(chunk_id_to_audio_url_map) != len(story_chunks):
        raise Exception(f"missing audio chunks compared to the story chunks")

    return [
        AudioMetadata(
            audio_text=sc.text,
            audio_url=chunk_id_to_audio_url_map[sc.id],
        )
        for sc in story_chunks
    ]


async def load_audio_bytes(filename: str) -> bytes:
    ## NOTE: This is only used when USES_LOCAL_FILE==True, this is local workaround.
    async with aiofiles.open(path_config.audio / filename, "rb") as f:
        audio_bytes = await f.read()

    return audio_bytes
