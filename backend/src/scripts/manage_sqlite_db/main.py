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


def save_db() -> None:
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
        with open(
            path_config._src_static / "to_ignore" / f"{table.__tablename__}.json", "w"
        ) as f:
            json.dump([d.model_dump() for d in full_data], f)


def load_db() -> None:
    sqlite = SQLiteClient()

    tables: list[Type[BaseTableModel]] = [
        Stories,
        WanikaniStories,
        StoryChunks,
        Audios,
        StoryAudios,
        StoryChunkAudios,
        Users,
        Configs,
    ]

    for table in tables:
        print(table.__tablename__)
        with open(path_config.seed_db / f"{table.__tablename__}.json", "r") as f:
            full_data = [table(**d) for d in json.load(f)]
        sqlite.insert(table=table, to_insert=full_data)
