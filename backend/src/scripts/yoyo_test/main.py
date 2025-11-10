from src.clients.sqlite import SQLiteClient


def main() -> None:
    sqlite = SQLiteClient()
    print(sqlite.execute("SELECT COUNT(*) FROM audios;"))
