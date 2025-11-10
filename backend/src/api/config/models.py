from pydantic import BaseModel
from src.models.uuid4str import UUID4Str


class WaitElement(BaseModel):
    wait: int


class SentencesElement(BaseModel):
    wait: int
    speed: int
    repeat: int


class FullDictationElement(BaseModel):
    speed: int


class ConfigModel(BaseModel):
    id: UUID4Str
    name: str
    sequence: list[WaitElement | SentencesElement | FullDictationElement]
