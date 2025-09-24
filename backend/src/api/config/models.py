from pydantic import BaseModel


class WaitElement(BaseModel):
    wait: int


class SentencesElement(BaseModel):
    wait: int
    speed: int


class FullDictationElement(BaseModel):
    speed: int


class ConfigModel(BaseModel):
    id: str
    name: str
    sequence: list[WaitElement | SentencesElement | FullDictationElement]
