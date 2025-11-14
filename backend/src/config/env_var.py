import os
from dataclasses import dataclass

ENV = os.getenv("ENV", "local")


@dataclass(frozen=True)
class MysqlConfig:
    database: str = os.getenv("MYSQL_DATABASE", "")
    user: str = os.getenv("MYSQL_USER", "")
    password: str = os.getenv("MYSQL_PASSWORD", "")
    port: int = int(os.getenv("MYSQL_PORT", 3306))
    host: str = os.getenv("MYSQL_HOST", "localhost")


@dataclass(frozen=True)
class VoiceVoxConfig:
    host: str = os.getenv("VOICEVOX_HOST", "localhost")
    port: int = int(os.getenv("VOICEVOX_PORT", 8888))


mysql_config = MysqlConfig()
voicevox_config = VoiceVoxConfig()
