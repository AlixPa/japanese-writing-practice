import json
from logging import Logger

import requests
from src.config.env_var import voicevox_config

from .models import Speaker


class VoiceVoxClient:
    def __init__(self, logger: Logger) -> None:
        self.logger = logger
        self.voicevox_url = f"http://{voicevox_config.host}:{voicevox_config.port}"

    def text_to_speech(
        self, japanese_text: str, speed: float, speaker_id: int
    ) -> bytes:
        query_payload = requests.post(
            f"{self.voicevox_url}/audio_query",
            params={"speaker": speaker_id, "text": japanese_text},
        )
        query_payload.raise_for_status()
        audio_query = query_payload.json()
        audio_query["speedScale"] = speed

        synthesis = requests.post(
            f"{self.voicevox_url}/synthesis",
            params={"speaker": speaker_id},
            headers={"Content-Type": "application/json"},
            json=audio_query,
        )
        synthesis.raise_for_status()
        return synthesis.content

    def list_speakers(self) -> list[Speaker]:
        resp = requests.get(f"{self.voicevox_url}/speakers")
        speakers_json = resp.json()
        return [Speaker(**r) for r in speakers_json]
