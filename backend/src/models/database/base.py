from uuid import uuid4

from pydantic import BaseModel, Field
from src.models.uuid4_validate import UUID4Str


class BaseTableModel(BaseModel):
    __abstract__ = True
    __tablename__: str

    id: UUID4Str = Field(default_factory=lambda: UUID4Str(uuid4()))
