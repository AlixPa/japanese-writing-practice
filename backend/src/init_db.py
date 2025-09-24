import json
from datetime import datetime
from typing import Any, Type

from src.clients.mysql import MysqlClientWriter
from src.config.runtime import STATIC_PATH
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

logger = get_logger()


def datetime_parser(obj: Any):
    for k, v in obj.items():
        if isinstance(v, str):
            try:
                obj[k] = datetime.fromisoformat(v)
            except ValueError:
                pass
    return obj


if __name__ == "__main__":
    mysql_writer = MysqlClientWriter(logger)
    tables: list[Type[BaseTableModel]] = [
        AudioTable,
        StoryTable,
        StoryChunkTable,
        WanikaniStoryTable,
        StoryAudioTable,
        StoryChunkAudioTable,
        ConfigTable,
    ]
    logger.info(f"Loading: {tables=}")

    for table in tables:
        with open(STATIC_PATH.SEED_DB / f"{table.__tablename__}.json", "r") as f:
            rows_raw = json.load(f, object_hook=datetime_parser)
            rows = [table(**r) for r in rows_raw]
            mysql_writer.start_transaction()
            try:
                mysql_writer.insert(table=table, to_insert=rows, or_ignore=True)
                mysql_writer.commit()
            except Exception:
                mysql_writer.rollback()
                raise
