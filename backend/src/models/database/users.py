from .base import BaseTableModel


class Users(BaseTableModel):
    __tablename__: str = "users"

    email: str | None = None
    google_sub: str | None = None
