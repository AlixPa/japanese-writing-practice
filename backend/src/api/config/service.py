import json

from src.clients.mysql import (
    AMysqlClientReader,
    AMysqlClientWriter,
    AMySqlIdNotFoundError,
)
from src.exceptions.http import WrongArgumentException
from src.logger import get_logger
from src.models.database import ConfigTable

from .models import ConfigModel, FullDictationElement, SentencesElement, WaitElement

logger = get_logger()


def str_to_sequence(
    sequence_str: str,
) -> list[WaitElement | SentencesElement | FullDictationElement]:
    sequence_raw = json.loads(sequence_str)
    ls_el: list[WaitElement | SentencesElement | FullDictationElement] = list()
    for e in sequence_raw:
        if "wait" not in e:
            ls_el.append(FullDictationElement(**e))
        elif not "speed" in e:
            ls_el.append(WaitElement(**e))
        else:
            ls_el.append(SentencesElement(**e))
    return ls_el


def sequence_to_str(
    sequence: list[WaitElement | SentencesElement | FullDictationElement],
) -> str:
    return json.dumps([s.model_dump() for s in sequence])


async def load_configs() -> list[ConfigModel]:
    mysql_reader = AMysqlClientReader(logger)

    configs_table = await mysql_reader.select(table=ConfigTable)
    return [
        ConfigModel(id=c.id, name=c.name, sequence=str_to_sequence(c.sequence))
        for c in configs_table
    ]


async def remove_config(config_id: str) -> None:
    mysql_writer = AMysqlClientWriter(logger)
    try:
        await mysql_writer.delete_by_id(table=ConfigTable, id=config_id)
    except AMySqlIdNotFoundError:
        raise WrongArgumentException(f"no config with {config_id=}")
    return


async def add_or_update_config(config: ConfigModel) -> str:
    mysql_writer = AMysqlClientWriter(logger)

    config_table = ConfigTable(
        id=config.id,
        name=config.name,
        sequence=sequence_to_str(config.sequence),
    )

    try:
        await mysql_writer.update_by_id(
            table=ConfigTable,
            id=config.id,
            update_col_value=dict(
                name=config_table.name,
                sequence=config_table.sequence,
            ),
        )
    except AMySqlIdNotFoundError:
        await mysql_writer.insert_one(table=ConfigTable, to_insert=config_table)

    return config_table.id
