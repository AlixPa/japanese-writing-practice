from src.clients.sqlite import SQLiteClient
from src.models.database import Configs, Users


def main() -> None:
    sqlite = SQLiteClient()
    print(sqlite.select(table=Users))
    print(sqlite.select(table=Configs))
