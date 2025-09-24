from typing import Type, TypeVar

from src.clients.mysql import MysqlClientReader
from src.logger import get_logger
from src.models.database import BaseTableModel

logger = get_logger()

GenericTableModel = TypeVar("GenericTableModel", bound=BaseTableModel)


def get_all_rows(table: Type[GenericTableModel]) -> list[GenericTableModel]:
    mysql_reader = MysqlClientReader(logger)
    return [e for e in mysql_reader.select(table=table)]
