from sqlalchemy import VARCHAR, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from .audio import Audio
from .base import BaseTableModel
from .story import Story


class StoryAudio(BaseTableModel):
    __tablename__ = "story_audio"
    __table_args__ = tuple(
        UniqueConstraint(
            "storyId",
            "speedPercentage",
            "speakerId",
            name="uq_story_audio_story_speed_speaker",
        )
    )

    storyId: Mapped[str] = mapped_column(
        VARCHAR(255),
        ForeignKey(Story.id, ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    audioId: Mapped[str] = mapped_column(
        VARCHAR(255),
        ForeignKey(Audio.id, ondelete="CASCADE"),
        nullable=False,
    )
    speedPercentage: Mapped[int] = mapped_column(
        TINYINT(unsigned=True),
        nullable=False,
    )
    speakerId: Mapped[int] = mapped_column(
        TINYINT(unsigned=True),
        nullable=False,
    )
