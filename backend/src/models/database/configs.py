from .base import BaseTableModel


class Configs(BaseTableModel):
    __tablename__: str = "configs"

    name: str
    sequence: str
    user_id: str
