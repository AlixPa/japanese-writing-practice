from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class PathConfig:
    _src_static: Path = Path(__file__).resolve().parents[1] / "static"
    audio: Path = _src_static / "audio_files"
    seed_db: Path = _src_static / "seed_db"
    local_data_scripts: Path = _src_static / "local_data"
    sqlite_db: Path = _src_static / "localdb.sqlite"
    front_dist: Path = _src_static.parents[2] / "frontend" / "dist"

    def __post_init__(self):
        self.audio.mkdir(parents=True, exist_ok=True)
        self.seed_db.mkdir(parents=True, exist_ok=True)
        self.local_data_scripts.mkdir(parents=True, exist_ok=True)


path_config = PathConfig()
