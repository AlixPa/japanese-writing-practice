from src.clients.sqlite import SQLiteClient
from src.models.database import AudioTable


def main() -> None:
    sqlite = SQLiteClient()
    # sqlite.execute("CREATE TABLE movie(title, year, score)")
    # sqlite.insert_one(table="movie", to_insert=dict(title="lala", year=1900, score=3))
    # sqlite.commit()
    print(sqlite.select(table=AudioTable))
    sqlite.insert_one(table=AudioTable, to_insert=AudioTable(url=""))
    print(sqlite.select(table=AudioTable))
    sqlite.rollback()
