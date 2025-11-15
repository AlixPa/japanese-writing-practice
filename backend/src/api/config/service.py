import json

from src.clients.sqlite import SQLiteClient, SqliteIdNotFoundError
from src.config.env_var import DEFAULT_CONFIG_ID
from src.exceptions.http import WrongArgumentException
from src.logger import get_logger
from src.models.database import Configs

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
        elif "speed" not in e:
            ls_el.append(WaitElement(**e))
        else:
            ls_el.append(SentencesElement(**e))
    return ls_el


def sequence_to_str(
    sequence: list[WaitElement | SentencesElement | FullDictationElement],
) -> str:
    return json.dumps([s.model_dump() for s in sequence])


async def load_configs(user_id: str) -> list[ConfigModel]:
    sqlite = SQLiteClient(logger)

    configs = sqlite.select(table=Configs, cond_equal=dict(user_id=user_id))

    # If no configs, copy default one for the user
    if not configs:
        default_config = sqlite.select_by_id(table=Configs, id=DEFAULT_CONFIG_ID)
        new_config = Configs(
            name=default_config.name, sequence=default_config.sequence, user_id=user_id
        )
        sqlite.insert_one(table=Configs, to_insert=new_config)
        configs = [new_config]
    return [
        ConfigModel(id=c.id, name=c.name, sequence=str_to_sequence(c.sequence))
        for c in configs
    ]


async def remove_config(config_id: str) -> None:
    sqlite = SQLiteClient(logger)
    try:
        sqlite.delete_by_id(table=Configs, id=config_id)
    except SqliteIdNotFoundError:
        raise WrongArgumentException(f"no config with {config_id=}")
    return


async def add_or_update_config(config: ConfigModel, user_id: str) -> str:
    sqlite = SQLiteClient(logger)

    config_table = Configs(
        id=config.id,
        name=config.name,
        sequence=sequence_to_str(config.sequence),
        user_id=user_id,
    )

    try:
        sqlite.update_by_id(
            table=Configs,
            id=config.id,
            update_col_value=dict(
                name=config_table.name,
                sequence=config_table.sequence,
            ),
        )
    except SqliteIdNotFoundError:
        sqlite.insert_one(table=Configs, to_insert=config_table)

    return config_table.id
