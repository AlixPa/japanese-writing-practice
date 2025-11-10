from src.models.uuid4_validate import UUID4Str

from .base import BaseTableModel


class StoryChunks(BaseTableModel):
    __tablename__ = "story_chunks"

    story_id: UUID4Str
    text: str
    position: int
