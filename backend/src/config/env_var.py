import os
from dataclasses import dataclass

ENV = os.getenv("ENV", "local")


@dataclass(frozen=True)
class VoiceVoxConfig:
    host: str = os.getenv("VOICEVOX_HOST", "localhost")
    port: int = int(os.getenv("VOICEVOX_PORT", 8888))


voicevox_config = VoiceVoxConfig()
