import json
from typing import Type

from src.clients.sqlite import SQLiteClient
from src.config.path import path_config
from src.models.database import (
    Audios,
    BaseTableModel,
    Configs,
    Stories,
    StoryAudios,
    StoryChunkAudios,
    StoryChunks,
    Users,
    WanikaniStories,
)


def main() -> None:
    sqlite = SQLiteClient()

    tables: list[Type[BaseTableModel]] = [
        Audios,
        StoryAudios,
        StoryChunkAudios,
        Stories,
        StoryChunks,
        WanikaniStories,
        Users,
        Configs,
    ]

    for table in tables:
        full_data = sqlite.select(table=table)
        with open(path_config.seed_db / f"{table.__tablename__}.json", "w") as f:
            json.dump([d.model_dump() for d in full_data], f)
