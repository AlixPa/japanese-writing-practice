from pydantic import Field
from src.models.uuid4_validate import UUID4Str

from .base import BaseTableModel


class WanikaniStories(BaseTableModel):
    __tablename__ = "wanikani_stories"

    story_id: UUID4Str
    level: int = Field(ge=1, le=60)
