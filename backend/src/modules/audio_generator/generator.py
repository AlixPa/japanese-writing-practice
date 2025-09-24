from logging import Logger

import requests
from openai import OpenAI
from src.config.env_var import VOICEVOX_HOST, VOICEVOX_PORT

from .config import GPT_CONFIG
from .models import Element, StoryGeneration


class Generator:
    def __init__(self, logger: Logger) -> None:
        self.openai = OpenAI()
        self.logger = logger
        self.voicevox_url = f"http://{VOICEVOX_HOST}:{VOICEVOX_PORT}"

    def generate_story(self, list_voc: list[Element]) -> StoryGeneration:
        """Generate a story from a list of vocabulary."""
        ls_voc = [e.element for e in list_voc]

        generation = self.openai.responses.create(
            model=GPT_CONFIG.GENERATION_MODEL,
            input=[
                {
                    "role": "developer",
                    "content": GPT_CONFIG.GENERATION_DEVELOPER_PROMPT,
                },
                {
                    "role": "user",
                    "content": GPT_CONFIG.GENERATION_PROMPT.format(ls_voc),
                },
            ],
        ).output_text

        correction = self.openai.responses.create(
            model=GPT_CONFIG.CORRECTION_MODEL,
            input=[
                {
                    "role": "user",
                    "content": GPT_CONFIG.CORRECTION_PROMPT.format(generation),
                },
            ],
        ).output_text

        title = self.openai.responses.create(
            model=GPT_CONFIG.NAME_MODEL,
            input=[
                {
                    "role": "user",
                    "content": GPT_CONFIG.NAME_PROMPT.format(correction),
                },
            ],
        ).output_text

        return StoryGeneration(
            input_vocabulary_list=list_voc, text=correction, title=title
        )

    def text_to_speech(self, japanese_text: str, speed: float) -> bytes:
        query_payload = requests.post(
            f"{self.voicevox_url}/audio_query",
            params={"speaker": 9, "text": japanese_text},
        )
        query_payload.raise_for_status()
        audio_query = query_payload.json()
        audio_query["speedScale"] = speed

        synthesis = requests.post(
            f"{self.voicevox_url}/synthesis",
            params={"speaker": 9},
            headers={"Content-Type": "application/json"},
            json=audio_query,
        )
        synthesis.raise_for_status()
        return synthesis.content
