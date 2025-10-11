from pydantic import BaseModel


class SpeakerStyle(BaseModel):
    name: str
    id: int
    type: str


class Speaker(BaseModel):
    name: str
    speaker_uuid: str
    styles: list[SpeakerStyle]
    version: str
    supported_features: dict
