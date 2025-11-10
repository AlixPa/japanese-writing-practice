from uuid import uuid4

from pydantic import BaseModel, Field
from src.models.uuid4str import UUID4Str


class BaseTableModel(BaseModel):
    __tablename__: str

    id: UUID4Str = Field(default_factory=lambda: UUID4Str(uuid4()))
