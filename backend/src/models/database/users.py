from .base import BaseTableModel


class Users(BaseTableModel):
    __tablename__: str = "users"

    mail: str | None = None
    google_sub: str | None = None
