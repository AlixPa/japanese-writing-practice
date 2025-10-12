from datetime import datetime
from uuid import uuid4

from sqlalchemy import DATETIME, VARCHAR, event, text
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import DeclarativeBase, Mapped, MappedAsDataclass, mapped_column


class Base(DeclarativeBase, MappedAsDataclass):
    pass


class BaseTableModel(Base, kw_only=True):
    __abstract__ = True

    id: Mapped[str] = mapped_column(
        VARCHAR(255),
        primary_key=True,
        default_factory=lambda: str(uuid4()),
    )
    createdAt: Mapped[datetime] = mapped_column(
        DATETIME(),
        nullable=False,
        default_factory=lambda: None,  # let db handle it
        server_default=text("CURRENT_TIMESTAMP"),
        index=True,
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DATETIME(),
        nullable=False,
        default_factory=lambda: None,  # let db handle it
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        index=True,
    )

    def _serialize_value(self, value: object):
        if isinstance(value, datetime):
            return value.isoformat()
        return value

    def to_dict(
        self,
        exclude_null: bool = False,
        exclude_col: list[str] | None = None,
        exclude_id: bool = False,
        include_col: list[str] | None = None,
        serialize: bool = False,
    ) -> dict[str, object]:
        """
        Convert model attributes to a dictionary.

        Parameters
        ----------
        exclude_null : bool, optional
            If True, exclude attributes with null values. Default is False.
        exclude_col : list[str], optional
            List of field names to exclude from the dictionary. Default is empty list.
        exclude_id : bool, optional
            If True, exclude the id field from the dictionary. Default is False.
        include_col : list[str], optional
            List of field names to include from the dictionary. Default is empty list.
            Cannot be used if some exclude options are used.
        serialize : bool, optional
            If True, serialize values (for later usage in json.dump). Default is False.

        Returns
        -------
        dict
            A dictionary representation of the model's attributes.
        """
        include_col = include_col or list()
        exclude_col = exclude_col or list()
        if include_col:
            if exclude_col or exclude_id or exclude_null:
                raise ValueError("cannot select include_field with exclude options")
            return {
                c.key: (
                    self._serialize_value(getattr(self, c.key))
                    if serialize
                    else getattr(self, c.key)
                )
                for c in inspect(self).mapper.column_attrs
                if c.key in include_col
            }
        return {
            c.key: (
                self._serialize_value(getattr(self, c.key))
                if serialize
                else getattr(self, c.key)
            )
            for c in inspect(self).mapper.column_attrs
            if (
                (not exclude_null or getattr(self, c.key) is not None)
                and c.key not in exclude_col
                and (c.key != "id" or not exclude_id)
            )
        }


# Allow to correctly load datetime from str (ex, json seed data)
@event.listens_for(BaseTableModel, "init", propagate=True)
def basetablemodel_init_listener(target, _, kwargs):
    for c in inspect(target).mapper.column_attrs:
        if c.key in kwargs and isinstance(kwargs[c.key], str):
            if isinstance(c.columns[0].type, DATETIME):
                ## NOTE if not isoformat, throw exception
                kwargs[c.key] = datetime.fromisoformat(kwargs[c.key])
