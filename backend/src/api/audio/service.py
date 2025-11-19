from src.clients.aws import S3Client
from src.clients.sqlite import SQLiteClient, SqliteIdNotFoundError
from src.config.aws import aws_config
from src.config.path import path_config
from src.config.runtime import USES_LOCAL_FILES
from src.exceptions.http import WrongArgumentException
from src.logger import get_logger
from src.models.database import (
    Audios,
    Stories,
    StoryAudios,
    StoryChunkAudios,
    StoryChunks,
)
from src.models.uuid4str import UUID4Str

from .models import AudioMetadata

logger = get_logger()


## TODO: async
def get_audio_url(audio_url: str) -> str:
    if USES_LOCAL_FILES:
        return f"/api/audio/{audio_url}"

    s3 = S3Client()
    try:
        return s3.presigned_url(
            bucket=aws_config.s3_buckets.japanese_dictation,
            prefix="audio",
            filename=audio_url,
        )
    finally:
        s3.close()


async def load_metadata(story_id: UUID4Str, speed: int) -> AudioMetadata:
    sqlite = SQLiteClient(logger)

    try:
        story = sqlite.select_by_id(table=Stories, id=story_id)
    except SqliteIdNotFoundError:
        raise WrongArgumentException(f"no story found for {story_id=}")

    story_audios = sqlite.select(
        table=StoryAudios, cond_equal=dict(story_id=story_id, speed_percentage=speed)
    )
    if not story_audios:
        raise WrongArgumentException(f"no audio for {story_id=}, {speed=}")

    audio = sqlite.select_by_id(table=Audios, id=story_audios[0].audio_id)

    return AudioMetadata(audio_text=story.text, audio_url=get_audio_url(audio.url))


async def load_sentence_metadata(story_id: UUID4Str, speed: int) -> list[AudioMetadata]:
    sqlite = SQLiteClient(logger)

    if not sqlite.id_exists(table=Stories, id=story_id):
        raise WrongArgumentException(f"no story found for {story_id=}")

    story_chunks = sqlite.select(
        table=StoryChunks,
        cond_equal=dict(
            story_id=story_id,
        ),
    )
    if not story_chunks:
        raise WrongArgumentException(f"no story chunks for {story_id=}")
    story_chunks.sort(key=lambda sc: sc.position)

    story_chunks_audio = sqlite.select(
        table=StoryChunkAudios,
        cond_equal=dict(speed_percentage=speed),
        cond_in=dict(story_chunk_id=[s.id for s in story_chunks]),
    )
    if not story_chunks_audio:
        raise WrongArgumentException(f"no audio chunks for {story_id=}, {speed=}")

    audios = sqlite.select(
        table=Audios, cond_in=dict(id=[sca.audio_id for sca in story_chunks_audio])
    )
    audio_id_to_url_map = {a.id: get_audio_url(a.url) for a in audios}
    chunk_id_to_audio_url_map = {
        sca.story_chunk_id: audio_id_to_url_map[sca.audio_id]
        for sca in story_chunks_audio
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
    with open(path_config.audio / filename, "rb") as f:
        audio_bytes = f.read()

    return audio_bytes
