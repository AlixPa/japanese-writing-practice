from pathlib import Path


class ServiceEnv:
    def __init__(self) -> None:
        self.LOCAL = "local"
        self.PRODUCTION = "production"


class StaticPath:
    def __init__(self) -> None:
        self.SRC = Path(__file__).resolve().parents[1] / "static"
        self.AUDIO = self.SRC / "audio_files"
        self.AUDIO.mkdir(parents=True, exist_ok=True)
        self.SEED_DB = self.SRC / "seed_db"
        self.SEED_DB.mkdir(parents=True, exist_ok=True)


SERVICE_ENV = ServiceEnv()
STATIC_PATH = StaticPath()
