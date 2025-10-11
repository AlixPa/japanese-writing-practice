import json
from typing import Type

from src.config.runtime import path_config
from src.logger import get_logger
from src.models.database import (
    AudioTable,
    BaseTableModel,
    ConfigTable,
    StoryAudioTable,
    StoryChunkAudioTable,
    StoryChunkTable,
    StoryTable,
    WanikaniStoryTable,
)

from .core import get_all_rows

logger = get_logger()


def main() -> None:
    tables: list[Type[BaseTableModel]] = [
        AudioTable,
        StoryTable,
        StoryChunkTable,
        WanikaniStoryTable,
        StoryAudioTable,
        StoryChunkAudioTable,
        ConfigTable,
    ]
    for table in tables:
        rows = get_all_rows(table)
        with open(path_config.seed_db / f"{table.__tablename__}.json", "w") as f:
            json.dump([r.to_dict(serialize=True) for r in rows], f)
