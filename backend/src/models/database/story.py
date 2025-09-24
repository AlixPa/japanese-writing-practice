from sqlalchemy import TEXT, VARCHAR
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseTableModel


class Story(BaseTableModel):
    __tablename__ = "story"

    title: Mapped[str] = mapped_column(
        VARCHAR(255),
        nullable=False,
    )
    text: Mapped[str] = mapped_column(
        TEXT(),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        VARCHAR(255),
        nullable=False,
    )
