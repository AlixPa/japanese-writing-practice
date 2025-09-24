from sqlalchemy import VARCHAR
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseTableModel


class Audio(BaseTableModel):
    __tablename__ = "audio"

    url: Mapped[str] = mapped_column(
        VARCHAR(255),
        nullable=False,
    )
    format: Mapped[str] = mapped_column(
        VARCHAR(255),
        nullable=False,
        default_factory=lambda: "WAV",
        server_default="WAV",
    )
