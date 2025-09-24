from sqlalchemy import VARCHAR, ForeignKey
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseTableModel
from .story import Story


class WanikaniStory(BaseTableModel):
    __tablename__ = "wanikani_story"

    storyId: Mapped[str] = mapped_column(
        VARCHAR(255),
        ForeignKey(Story.id, ondelete="CASCADE"),
        nullable=False,
    )
    level: Mapped[int] = mapped_column(
        TINYINT(unsigned=True),
        nullable=False,
        index=True,
    )
