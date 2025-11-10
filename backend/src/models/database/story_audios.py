from src.models.uuid4str import UUID4Str

from .base import BaseTableModel


class StoryAudios(BaseTableModel):
    __tablename__ = "story_audios"

    story_id: UUID4Str
    audio_id: UUID4Str
    speed_percentage: int
    speaker_id: int
