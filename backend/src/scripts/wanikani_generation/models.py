from pydantic import BaseModel


class AudioChunk(BaseModel):
    text: str
    audio_path: str
