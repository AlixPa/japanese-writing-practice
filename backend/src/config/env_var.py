import os

ENV = os.getenv("ENV", "local")

MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "")
MYSQL_USER = os.getenv("MYSQL_USER", "")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")

VOICEVOX_HOST = os.getenv("VOICEVOX_HOST", "localhost")
VOICEVOX_PORT = int(os.getenv("VOICEVOX_PORT", 8888))
