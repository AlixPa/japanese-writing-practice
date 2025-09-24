import random

from src.logger import get_logger
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


def main(
    level_from: int = 1,
    level_to: int = 60,
    speed_percentages: list[int] = [70, 100],
    stories_per_level: int = 1,
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
            logger.info(f"Generating {story_idx} for {level=} with {local_vocs=}")

            generated_story = generator.generate_story(local_vocs)
            # generated_story = StoryGeneration(
            #     input_vocabulary_list=list(),
            #     text="",
            #     title="",
            # )
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
                )
                logger.info(
                    f"Saved wav file of ({level=}, {speed_percentage=}) as {audio_file_dest=}"
                )

                insert_audio_metadata(
                    story=story,
                    audio_file_dest=audio_file_dest,
                    speed_percentage=speed_percentage,
                )

                audio_chunks = gen_and_store_chunks(
                    story_chunks=story_chunks,
                    generator=generator,
                    speed_percentage=speed_percentage,
                )
                for audio_chunk, story_chunk in zip(audio_chunks, story_chunks):
                    insert_audio_chunk_metadata(
                        story_chunk=story_chunk,
                        audio_chunk=audio_chunk,
                        speed_percentage=speed_percentage,
                    )
