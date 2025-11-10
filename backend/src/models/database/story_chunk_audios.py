from pydantic import Field
from src.models.uuid4str import UUID4Str

from .base import BaseTableModel


class StoryChunkAudios(BaseTableModel):
    __tablename__ = "story_chunk_audios"

    story_chunk_id: UUID4Str
    audio_id: UUID4Str
    speed_percentage: int = Field(ge=0, le=100)
    speaker_id: int = Field(ge=1, le=109)
