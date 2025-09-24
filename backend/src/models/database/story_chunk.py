from sqlalchemy import TEXT, VARCHAR, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseTableModel
from .story import Story


class StoryChunk(BaseTableModel):
    __tablename__ = "story_chunk"

    storyId: Mapped[str] = mapped_column(
        VARCHAR(255),
        ForeignKey(Story.id, ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text: Mapped[str] = mapped_column(
        TEXT(),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(
        TINYINT(),
        nullable=False,
    )
    UniqueConstraint("storyId", "position")
