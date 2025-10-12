import json
import os
import random

from src.config.runtime import path_config
from src.logger import get_logger
from src.models.database import StoryTable, WanikaniStoryTable
from src.modules.audio_generator import AudioGenerator, StoryGeneration

from .core import (
    chunkify_story,
    gen_and_store_chunks,
    gen_and_store_text_audio,
    insert_audio_chunk_metadata,
    insert_audio_metadata,
    insert_story,
    insert_story_chunk,
    load_voc,
)

logger = get_logger()


def gen_with_gpt(
    level_from: int = 1,
    level_to: int = 60,
    speed_percentages: list[int] = [65, 90, 100],
    stories_per_level: int = 1,
    speaker_id: int = 27,
) -> None:
    assert 1 <= level_from <= 60
    assert 1 <= level_to <= 60

    generator = AudioGenerator(logger)

    logger.info(f"Starting wanikani stories generations: ({level_from=}, {level_to=})")
    for level in range(level_from, level_to + 1):
        vocs = load_voc(level)
        logger.info(f"Loaded vocs of {level=}, {vocs=}")

        for story_idx in range(1, stories_per_level + 1):
            random.shuffle(vocs)
            local_vocs = vocs[:20]
            logger.info(f"Generating {story_idx=} for {level=} with {local_vocs=}")

            generated_story = generator.generate_story(local_vocs)
            logger.info(f"Generated story of {level=}, {generated_story=}")

            story = insert_story(generated_story=generated_story, level=level)
            story_chunks_str = chunkify_story(generated_story)
            logger.info(f"Chunkified in: {story_chunks_str=}")
            story_chunks = [
                insert_story_chunk(story=story, text=chunk_str, position=position + 1)
                for position, chunk_str in enumerate(story_chunks_str)
            ]

            for speed_percentage in speed_percentages:
                audio_file_dest = gen_and_store_text_audio(
                    generator=generator,
                    text=generated_story.text,
                    speed_percentage=speed_percentage,
                    speaker_id=speaker_id,
                )
                logger.info(
                    f"Saved wav file of ({level=}, {speed_percentage=}) as {audio_file_dest=}"
                )

                insert_audio_metadata(
                    story=story,
                    audio_file_dest=audio_file_dest,
                    speed_percentage=speed_percentage,
                    speaker_id=speaker_id,
                )

                audio_chunks = gen_and_store_chunks(
                    story_chunks=story_chunks,
                    generator=generator,
                    speed_percentage=speed_percentage,
                    speaker_id=speaker_id,
                )
                for audio_chunk, story_chunk in zip(audio_chunks, story_chunks):
                    insert_audio_chunk_metadata(
                        story_chunk=story_chunk,
                        audio_chunk=audio_chunk,
                        speed_percentage=speed_percentage,
                        speaker_id=speaker_id,
                    )


def gen_using_seed(
    speed_percentages: list[int] = [65, 90, 100],
    speaker_id: int = 27,
) -> None:
    generator = AudioGenerator(logger)

    logger.info(
        f"Starting wanikani stories generations from seed. Loading existing stories."
    )

    with open(path_config.seed_db / "wanikani_story.json", "r") as f:
        wanikani_stories_json = json.load(f)
        wanikani_stories = [WanikaniStoryTable(**s) for s in wanikani_stories_json]

    with open(path_config.seed_db / "story.json", "r") as f:
        stories_json = json.load(f)
        stories = [StoryTable(**s) for s in stories_json]
        story_id_to_story_map = {s.id: s for s in stories}

    logger.info(f"Loaded {len(wanikani_stories)=}")

    for wanikani_story in wanikani_stories:
        story = story_id_to_story_map[wanikani_story.storyId]
        generated_story = StoryGeneration(
            input_vocabulary_list=list(), text=story.text, title=story.title
        )
        logger.info(f"Got the story {generated_story=}")

        story = insert_story(
            generated_story=generated_story, level=wanikani_story.level
        )
        story_chunks_str = chunkify_story(generated_story)
        logger.info(f"Chunkified in: {story_chunks_str=}")
        story_chunks = [
            insert_story_chunk(story=story, text=chunk_str, position=position + 1)
            for position, chunk_str in enumerate(story_chunks_str)
        ]

        for speed_percentage in speed_percentages:
            audio_file_dest = gen_and_store_text_audio(
                generator=generator,
                text=generated_story.text,
                speed_percentage=speed_percentage,
                speaker_id=speaker_id,
            )
            logger.info(
                f"Saved wav file of ({wanikani_story.level=}, {speed_percentage=}) as {audio_file_dest=}"
            )

            insert_audio_metadata(
                story=story,
                audio_file_dest=audio_file_dest,
                speed_percentage=speed_percentage,
                speaker_id=speaker_id,
            )

            audio_chunks = gen_and_store_chunks(
                story_chunks=story_chunks,
                generator=generator,
                speed_percentage=speed_percentage,
                speaker_id=speaker_id,
            )
            for audio_chunk, story_chunk in zip(audio_chunks, story_chunks):
                insert_audio_chunk_metadata(
                    story_chunk=story_chunk,
                    audio_chunk=audio_chunk,
                    speed_percentage=speed_percentage,
                    speaker_id=speaker_id,
                )
