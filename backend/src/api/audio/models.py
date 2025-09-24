from pydantic import BaseModel


class AudioMetadata(BaseModel):
    audio_text: str
    audio_id: str
