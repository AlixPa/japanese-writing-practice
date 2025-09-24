from sqlalchemy import TEXT, VARCHAR
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseTableModel


class Config(BaseTableModel):
    __tablename__ = "config"

    name: Mapped[str] = mapped_column(
        VARCHAR(255),
        nullable=False,
    )
    sequence: Mapped[str] = mapped_column(
        TEXT(),
        nullable=False,
    )
