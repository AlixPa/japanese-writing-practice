import os
from dataclasses import dataclass

ENV = os.getenv("ENV", "local")
DEFAULT_CONFIG_ID = "02bc9f55-9d6c-4e70-b10d-7b38e3b65ae1"


@dataclass(frozen=True)
class VoiceVoxConfig:
    host: str = os.getenv("VOICEVOX_HOST", "localhost")
    port: int = int(os.getenv("VOICEVOX_PORT", 8888))


voicevox_config = VoiceVoxConfig()
