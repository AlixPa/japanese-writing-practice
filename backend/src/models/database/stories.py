from .base import BaseTableModel


class Stories(BaseTableModel):
    __tablename__ = "stories"

    title: str
    text: str
    source: str
