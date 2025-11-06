from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ServiceEnv:
    local: str = "local"
    production: str = "production"


@dataclass(frozen=True)
class PathConfig:
    _src_static: Path = Path(__file__).resolve().parents[1] / "static"
    audio: Path = _src_static / "audio_files"
    seed_db: Path = _src_static / "seed_db"
    local_data_scripts: Path = _src_static / "local_data"
    sqlite_db: Path = _src_static / "japanese_dictation.db"

    def __post_init__(self):
        self.audio.mkdir(parents=True, exist_ok=True)
        self.seed_db.mkdir(parents=True, exist_ok=True)
        self.local_data_scripts.mkdir(parents=True, exist_ok=True)


service_env = ServiceEnv()
path_config = PathConfig()
