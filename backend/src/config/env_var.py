import os
from dataclasses import dataclass

ENV = os.getenv("ENV", "local")
DEFAULT_CONFIG_ID = "2c398078-62ec-40a8-bf61-a738c709d666"
DEFAULT_USER_ID = "2df57de3-051c-4d63-822e-b677c5b91927"


@dataclass(frozen=True)
class VoiceVoxConfig:
    host: str = os.getenv("VOICEVOX_HOST", "localhost")
    port: int = int(os.getenv("VOICEVOX_PORT", 8888))


voicevox_config = VoiceVoxConfig()
