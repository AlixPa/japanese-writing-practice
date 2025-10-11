from logging import Logger

import requests
from openai import OpenAI
from src.clients.voicevox import VoiceVoxClient

from .config import gpt_config
from .models import Element, StoryGeneration


class Generator:
    def __init__(self, logger: Logger) -> None:
        self.openai = OpenAI()
        self.logger = logger
        self.voicevox_client = VoiceVoxClient(self.logger)

    def generate_story(self, list_voc: list[Element]) -> StoryGeneration:
        """Generate a story from a list of vocabulary."""
        ls_voc = [e.element for e in list_voc]

        generation = self.openai.responses.create(
            model=gpt_config.generation_model,
            input=[
                {
                    "role": "developer",
                    "content": gpt_config.generation_developer_prompt,
                },
                {
                    "role": "user",
                    "content": gpt_config.generation_prompt.format(ls_voc),
                },
            ],
        ).output_text

        correction = self.openai.responses.create(
            model=gpt_config.correction_model,
            input=[
                {
                    "role": "user",
                    "content": gpt_config.correction_prompt.format(generation),
                },
            ],
        ).output_text

        title = self.openai.responses.create(
            model=gpt_config.name_model,
            input=[
                {
                    "role": "user",
                    "content": gpt_config.name_prompt.format(correction),
                },
            ],
        ).output_text

        return StoryGeneration(
            input_vocabulary_list=list_voc, text=correction, title=title
        )

    def text_to_speech(
        self, japanese_text: str, speed: float, speaker_id: int = 9
    ) -> bytes:
        return self.voicevox_client.text_to_speech(
            japanese_text=japanese_text, speed=speed, speaker_id=speaker_id
        )
