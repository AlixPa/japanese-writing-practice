from pydantic import Field

from .base import BaseTableModel


class Audios(BaseTableModel):
    __tablename__ = "audios"

    url: str
    format: str = Field(default_factory=lambda: "WAV")
