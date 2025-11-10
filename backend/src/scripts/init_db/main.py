import json

from src.clients.sqlite import SQLiteClient
from src.config.runtime import PathConfig
from src.models.database import (
    Audios,
    Configs,
    Stories,
    StoryAudios,
    StoryChunkAudios,
    StoryChunks,
    WanikaniStories,
)


def main() -> None:
    sqlite = SQLiteClient()

    file_type_map = {
        "audios.json": Audios,
        "configs.json": Configs,
        "stories.json": Stories,
        "story_audios.json": StoryAudios,
        "story_chunk_audios.json": StoryChunkAudios,
        "story_chunks.json": StoryChunks,
        "wanikani_stories.json": WanikaniStories,
    }

    for file, table in file_type_map.items():
        # with open(PathConfig().seed_db / file, "r") as f:
        #     es_json = json.load(f)
        # es = [table(**a) for a in es_json]
        # sqlite.start_transaction()
        # sqlite.insert(table=table, to_insert=es)
        # sqlite.commit()

        print(sqlite.select(table=table, limit=2))
