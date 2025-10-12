import json
import re
from pathlib import Path
from uuid import uuid4

from src.clients.mysql.sync_client import MysqlClientWriter
from src.config.runtime import path_config
from src.logger import get_logger
from src.models.database import (
    AudioTable,
    StoryAudioTable,
    StoryChunkAudioTable,
    StoryChunkTable,
    StoryTable,
    WanikaniStoryTable,
)
from src.modules.audio_generator import AudioGenerator, Element, StoryGeneration

from .models import AudioChunk

VOC_FOLDER_PATH = Path(__file__).resolve().parents[0] / "vocabulary_per_level"
logger = get_logger()


def load_voc(level: int) -> list[Element]:
    with open(VOC_FOLDER_PATH / f"{level}.json", "r") as f:
        voc_dict = json.load(f)
    return [Element(**e) for e in voc_dict]


def gen_and_store_text_audio(
    text: str,
    generator: AudioGenerator,
    speed_percentage: int,
    speaker_id: int,
) -> str:
    audio_bytes = generator.text_to_speech(
        japanese_text=text,
        speed=float(speed_percentage) / 100,
        speaker_id=speaker_id,
    )
    audio_file_dest = str(uuid4()) + ".wav"
    ## NOTE: Here we use default just because I want them in the base application
    with open(path_config.audio / "default" / audio_file_dest, "wb") as f:
        f.write(audio_bytes)

    return audio_file_dest


def insert_story(generated_story: StoryGeneration, level: int) -> StoryTable:
    mysql_writer = MysqlClientWriter(logger)
    mysql_writer.start_transaction()
    try:
        story = StoryTable(
            title=generated_story.title,
            text=generated_story.text,
            source="wanikani",
        )
        mysql_writer.insert_one(table=StoryTable, to_insert=story)
        logger.info(f"Inserted {story=}")

        wanikani_story = WanikaniStoryTable(storyId=story.id, level=level)
        mysql_writer.insert_one(table=WanikaniStoryTable, to_insert=wanikani_story)
        logger.info(f"Inserted {wanikani_story=}")

        mysql_writer.commit()
        return story
    except Exception:
        mysql_writer.rollback()
        raise


def insert_audio_metadata(
    story: StoryTable,
    audio_file_dest: str,
    speed_percentage: int,
    speaker_id: int,
) -> StoryTable:
    mysql_writer = MysqlClientWriter(logger)
    mysql_writer.start_transaction()
    try:

        audio = AudioTable(url=audio_file_dest)
        mysql_writer.insert_one(table=AudioTable, to_insert=audio)
        logger.info(f"Inserted {audio=}")

        story_audio = StoryAudioTable(
            storyId=story.id,
            audioId=audio.id,
            speedPercentage=speed_percentage,
            speakerId=speaker_id,
        )
        mysql_writer.insert_one(table=StoryAudioTable, to_insert=story_audio)
        logger.info(f"Inserted {story_audio=}")

        mysql_writer.commit()
        return story
    except Exception:
        mysql_writer.rollback()
        raise


def chunkify_story(generated_story: StoryGeneration) -> list[str]:
    return [
        e.strip()
        for e in re.split(r"[。、「」『』！？…・（）]", generated_story.text)
        if e.strip()
    ]


def gen_and_store_chunks(
    story_chunks: list[StoryChunkTable],
    generator: AudioGenerator,
    speed_percentage: int,
    speaker_id: int,
) -> list[AudioChunk]:
    ls_audio_chunks: list[AudioChunk] = list()
    for story_chunk in story_chunks:
        audio_path = gen_and_store_text_audio(
            text=story_chunk.text,
            generator=generator,
            speed_percentage=speed_percentage,
            speaker_id=speaker_id,
        )
        ls_audio_chunks.append(AudioChunk(text=story_chunk.text, audio_path=audio_path))
    return ls_audio_chunks


def insert_story_chunk(
    story: StoryTable,
    text: str,
    position: int,
) -> StoryChunkTable:
    mysql_writer = MysqlClientWriter(logger)
    mysql_writer.start_transaction()
    try:
        story_chunk = StoryChunkTable(
            storyId=story.id,
            text=text,
            position=position,
        )
        mysql_writer.insert_one(table=StoryChunkTable, to_insert=story_chunk)
        logger.info(f"Inserted {story_chunk=}")

        mysql_writer.commit()
        return story_chunk
    except Exception:
        mysql_writer.rollback()
        raise


def insert_audio_chunk_metadata(
    story_chunk: StoryChunkTable,
    audio_chunk: AudioChunk,
    speed_percentage: int,
    speaker_id: int,
) -> None:
    mysql_writer = MysqlClientWriter(logger)
    mysql_writer.start_transaction()
    try:
        audio = AudioTable(url=audio_chunk.audio_path)
        mysql_writer.insert_one(table=AudioTable, to_insert=audio)
        logger.info(f"Inserted {audio=}")

        story_chunk_audio = StoryChunkAudioTable(
            storyChunkId=story_chunk.id,
            audioId=audio.id,
            speedPercentage=speed_percentage,
            speakerId=speaker_id,
        )
        mysql_writer.insert_one(table=StoryChunkAudioTable, to_insert=story_chunk_audio)
        logger.info(f"Inserted {story_chunk_audio=}")

        mysql_writer.commit()
    except Exception:
        mysql_writer.rollback()
        raise
