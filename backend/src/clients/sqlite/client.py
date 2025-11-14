import sqlite3
import traceback
from abc import ABC
from logging import Logger
from typing import Literal, Type, TypeVar, cast, overload

from src.config.path import path_config
from src.logger import get_logger
from src.models.database import BaseTableModel

from .exceptions import (
    SqliteColumnInconsistencyError,
    SqliteDuplicateColumnUpdateError,
    SqliteIdNotFoundError,
    SqliteNoConnectionError,
    SqliteNoUpdateValuesError,
    SqliteNoValueInsertionError,
)

GenericTableModel = TypeVar("GenericTableModel", bound=BaseTableModel)


class SQLiteClient(ABC):
    def __init__(
        self,
        logger: Logger | None = None,
        isolation_level: Literal["DEFERRED"] | None = None,
    ) -> None:
        self.logger = logger or get_logger("SQLiteClient-logger")
        self.connection: sqlite3.Connection | None = None
        self.cursor: sqlite3.Cursor | None = None
        assert isolation_level in {"DEFERRED", None}
        self._isolation_level = isolation_level
        self._connect()

    def _connect(self) -> None:
        if self.connection:
            self.connection.close()
        self.connection = sqlite3.connect(
            path_config.sqlite_db, isolation_level=self._isolation_level  # type: ignore
        )
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON;")

    def _logging(
        self, cursor: sqlite3.Cursor, query: str, params: tuple | None
    ) -> None:
        self.logger.debug(
            f"SQLiteClient executed: {cursor.rowcount=}, {query=}, {params=}"
        )

    def _generate_cond(
        self,
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> tuple[str, tuple]:
        """
        Function that generates the condition as well as the args for any query

        Returns
        -------
        str
            The condition Starting with WHERE of the sql query
        tuple
            The args parameter to give to SqlClient.execute
        """
        conds = ["WHERE 1 = 1"]
        args = list()

        for col in cond_null:
            conds.append(f"AND {col} IS NULL")

        for col in cond_not_null:
            conds.append(f"AND {col} IS NOT NULL")

        for col, ls_val in cond_in.items():
            if len(ls_val) == 0:
                continue
            conds.append(f"AND {col} IN (" + ",".join(["?"] * len(ls_val)) + ")")
            args.extend(ls_val)

        for col, val in cond_equal.items():
            conds.append(f"AND {col} = ?")
            args.append(val)

        for col, val in cond_non_equal.items():
            conds.append(f"AND {col} <> ?")
            args.append(val)

        for col, val in cond_less_or_eq.items():
            conds.append(f"AND {col} <= ?")
            args.append(val)

        for col, val in cond_greater_or_eq.items():
            conds.append(f"AND {col} >= ?")
            args.append(val)

        for col, val in cond_less.items():
            conds.append(f"AND {col} < ?")
            args.append(val)

        for col, val in cond_greater.items():
            conds.append(f"AND {col} > ?")
            args.append(val)

        return " ".join(conds), tuple(args)

    def execute(self, query: str, args: tuple | None = None) -> list[dict[str, object]]:
        """
        Execute a SQL query and return the results.

        Parameters
        ----------
        query : str
            SQL query to execute
        args : tuple | None, optional
            Parameters to pass to the query, by default None

        Returns
        -------
        tuple
            Results of the query execution
        """
        if not self.connection:
            raise SqliteNoConnectionError("Could not execute query, no connection yet.")
        self.cursor = self.connection.cursor()
        try:
            self.cursor.execute(query, args or ())
            res = self.cursor.fetchall()
        except Exception:
            self.logger.warning(
                f"error while executing query, {traceback.format_exc()}"
            )
            raise
        self._logging(self.cursor, query, args)
        self.cursor.close()
        self.cursor = None
        return res

    @overload
    def count(
        self,
        table: str,
        select_col: list[str] = list(),
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> int: ...

    @overload
    def count(
        self,
        table: Type[GenericTableModel],
        select_col: list[str] = list(),
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> int: ...

    def count(
        self,
        table: str | Type[GenericTableModel],
        select_col: list[str] = list(),
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> int | None:
        """
        Execute a SELECT COUNT(...) query with various conditions.

        Parameters
        ----------
        table : str
            Table to query
        select_col : list[str], optional
            List of columns to include in the COUNT(...), by default all columns
        cond_null : list[str], optional
            Columns that must be NULL
        cond_not_null : list[str], optional
            Columns that must not be NULL
        cond_in : dict[str, list], optional
            Column values that must be in given list
        cond_eq : dict[str, object], optional
            Column values that must equal given value
        cond_neq : dict[str, object], optional
            Column values that must not equal given value
        cond_leq : dict[str, object], optional
            Column values that must be less than or equal to given value
        cond_geq : dict[str, object], optional
            Column values that must be greater than or equal to given value
        cond_l : dict[str, object], optional
            Column values that must be less than given value
        cond_g : dict[str, object], optional
            Column values that must be greater than given value

        Returns
        -------
        int
            result of the count
        None
            if query went wrong
        """
        table_name = table if isinstance(table, str) else table.__tablename__
        query_parts = [
            f"SELECT COUNT({', '.join(select_col) if select_col else '*'}) AS ct FROM {table_name}"
        ]
        cond, args = self._generate_cond(
            cond_equal=cond_equal,
            cond_greater=cond_greater,
            cond_greater_or_eq=cond_greater_or_eq,
            cond_in=cond_in,
            cond_less=cond_less,
            cond_less_or_eq=cond_less_or_eq,
            cond_non_equal=cond_non_equal,
            cond_not_null=cond_not_null,
            cond_null=cond_null,
        )

        query_parts.append(cond)
        query_parts.append(";")

        res_Sql = self.execute(query=" ".join(query_parts), args=args)
        if not res_Sql:
            return None
        res = res_Sql[0]["ct"]
        return int(str(res))

    @overload
    def select(
        self,
        table: str,
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
        order_by: str = "",
        ascending_order: bool = True,
        limit: int = 0,
        offset: int = 0,
        select_col: list[str] = list(),
    ) -> list[dict[str, object]]: ...

    @overload
    def select(
        self,
        table: Type[GenericTableModel],
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
        order_by: str = "",
        ascending_order: bool = True,
        limit: int = 0,
        offset: int = 0,
    ) -> list[GenericTableModel]: ...

    def select(
        self,
        table: str | Type[GenericTableModel],
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
        order_by: str = "",
        ascending_order: bool = True,
        limit: int = 0,
        offset: int = 0,
        select_col: list[str] = list(),
    ) -> list[dict[str, object]] | list[GenericTableModel]:
        """
        Execute a SELECT query with various conditions.

        Parameters
        ----------
        table : str | Type[T]
            Table name or actual table class to query from
        select_col : list[str], optional
            List of columns to select, by default all columns. Note that this should not be used with a SqlModel expected return.
        cond_null : list[str], optional
            Columns that must be NULL
        cond_not_null : list[str], optional
            Columns that must not be NULL
        cond_in : dict[str, list], optional
            Column values that must be in given list
        cond_eq : dict[str, object], optional
            Column values that must equal given value
        cond_neq : dict[str, object], optional
            Column values that must not equal given value
        cond_leq : dict[str, object], optional
            Column values that must be less than or equal to given value
        cond_geq : dict[str, object], optional
            Column values that must be greater than or equal to given value
        cond_l : dict[str, object], optional
            Column values that must be less than given value
        cond_g : dict[str, object], optional
            Column values that must be greater than given value
        limit : int, optional
            Maximum number of rows to return, 0 means all, by default 0
        offset : int, optional
            Number of rows to skip before returning results, 0 means no offset, by default 0

        Returns
        -------
        tuple
            Query results as a tuple of dictionaries or actual class if given
        """
        if isinstance(table, str):
            query_parts = [
                f"SELECT {', '.join(select_col) if select_col else '*'} FROM {table}"
            ]
        else:
            query_parts = [f"SELECT * FROM {table.__tablename__}"]
        cond, args = self._generate_cond(
            cond_equal=cond_equal,
            cond_greater=cond_greater,
            cond_greater_or_eq=cond_greater_or_eq,
            cond_in=cond_in,
            cond_less=cond_less,
            cond_less_or_eq=cond_less_or_eq,
            cond_non_equal=cond_non_equal,
            cond_not_null=cond_not_null,
            cond_null=cond_null,
        )
        query_parts.append(cond)
        if order_by:
            query_parts.append(
                f"ORDER BY {order_by} {'ASC' if ascending_order else 'DESC'}"
            )
        if limit > 0:
            query_parts.append(f"LIMIT {limit}")
            query_parts.append(f"OFFSET {offset}")
        query_parts.append(";")
        res_Sql = self.execute(query=" ".join(query_parts), args=args)
        if isinstance(table, str):
            return res_Sql
        else:
            return list(table(**r) for r in res_Sql)  # type: ignore

    @overload
    def select_by_id(
        self,
        table: str,
        id: str,
        select_col: list[str] = list(),
    ) -> dict[str, object]: ...

    @overload
    def select_by_id(
        self,
        table: Type[GenericTableModel],
        id: str,
    ) -> GenericTableModel: ...

    def select_by_id(
        self,
        table: str | Type[GenericTableModel],
        id: str,
        select_col: list[str] = list(),
    ) -> dict[str, object] | GenericTableModel:
        """
        Select a row from a database table by its ID.

        Parameters
        ----------
        table : str | Type[T]
            Table name or actual table class to query from
        id : str
            ID of the row to select
        select_col : list[str], optional
            List of columns to select, by default all columns. Note that this should not be used with a SqlModel expected return.

        Returns
        -------
        dict[str, object] | T
            Selected row as a dictionnary or actual class if given
        """
        if isinstance(table, str):
            res_Sql = self.select(
                table=table,
                select_col=select_col,
                cond_equal={"id": id},
            )
        else:
            res_Sql = self.select(
                table=table,
                cond_equal={"id": id},
            )
        if not res_Sql:
            raise SqliteIdNotFoundError(
                f"{id=} not found during select in table {table if isinstance(table, str) else table.__tablename__}"
            )
        return res_Sql[0]

    @overload
    def id_exists(
        self,
        table: str,
        id: str,
    ) -> bool: ...

    @overload
    def id_exists(
        self,
        table: Type[GenericTableModel],
        id: str,
    ) -> bool: ...

    def id_exists(
        self,
        table: str | Type[GenericTableModel],
        id: str,
    ) -> bool:
        try:
            self.select_by_id(table=table, id=id)
            return True
        except SqliteIdNotFoundError:
            return False

    def start_transaction(self) -> None:
        self._connect()

    def commit(self) -> None:
        """
        Commits the transaction.
        """
        if not self.connection:
            raise SqliteNoConnectionError("Cannot commit if transaction is closed.")
        self.connection.commit()
        self.connection.close()
        self._connect()

    def rollback(self) -> None:
        """
        Rollback the transaction.
        """
        if not self.connection:
            raise SqliteNoConnectionError("Cannot commit if transaction is closed.")
        self.connection.rollback()
        self.connection.close()
        self._connect()

    @overload
    def insert_one(
        self,
        table: str,
        to_insert: dict[str, object],
        or_ignore=False,
    ) -> None: ...

    @overload
    def insert_one(
        self,
        table: Type[GenericTableModel],
        to_insert: GenericTableModel,
        or_ignore=False,
    ) -> None: ...

    def insert_one(
        self,
        table: str | Type[GenericTableModel],
        to_insert: dict[str, object] | GenericTableModel,
        or_ignore=False,
    ) -> None:
        """
        Insert a single row into a database table.

        Parameters
        ----------
        table_name : str
            Name of the table to insert into
        to_insert : dict
            Dictionary of column names and their corresponding values
        or_ignore : bool, optional
            If True, use INSERT IGNORE, default False
        """
        # For typing
        if isinstance(table, str):
            to_insert = cast(dict[str, object], to_insert)
            self.insert(
                table=table,
                to_insert=[to_insert],
                or_ignore=or_ignore,
            )
        else:
            to_insert = cast(GenericTableModel, to_insert)
            self.insert(
                table=table,
                to_insert=[to_insert],
                or_ignore=or_ignore,
            )

    @overload
    def insert(
        self,
        table: str,
        to_insert: list[dict[str, object]],
        or_ignore=False,
    ) -> None: ...

    @overload
    def insert(
        self,
        table: Type[GenericTableModel],
        to_insert: list[GenericTableModel],
        or_ignore=False,
    ) -> None: ...

    def insert(
        self,
        table: str | Type[GenericTableModel],
        to_insert: list[dict[str, object]] | list[GenericTableModel],
        or_ignore=False,
    ) -> None:
        """
        Insert multiple rows into a database table.

        Parameters
        ----------
        table_name : str
            Name of the table to insert into
        to_insert : list[dict[str, object]]
            List of dictionary of column names and their corresponding values
        or_ignore : bool, optional
            If True, use INSERT IGNORE, default False
        """
        if isinstance(table, str):
            to_insert_dict = cast(list[dict[str, object]], to_insert)
        else:
            to_insert = cast(list[GenericTableModel], to_insert)
            to_insert_dict = [e.model_dump() for e in to_insert]

        for row in to_insert_dict:
            if "createdAt" in row:
                del row["createdAt"]
            if "updatedAt" in row:
                del row["updatedAt"]

        to_insert_dict = [row for row in to_insert_dict if row]
        if not to_insert_dict:
            raise SqliteNoValueInsertionError()

        cols = set(to_insert_dict[0].keys())
        for row in to_insert_dict:
            for col in cols:
                if not col in row:
                    raise SqliteColumnInconsistencyError(
                        f"{col=} is not in one of the row to insert: {row=}"
                    )
            for col in row:
                if not col in cols:
                    raise SqliteColumnInconsistencyError(
                        f"{col=} is not in the first row to insert: col_of_first_row={cols}"
                    )
        cols = list(cols)

        if isinstance(table, str):
            table_name = table
        else:
            table_name = table.__tablename__

        query_parts = [f"INSERT {"IGNORE" if or_ignore else ""} INTO {table_name}"]
        query_parts.append(f"({",".join(cols)})")
        query_parts.append("VALUES")

        insert_part = list()
        args = list()
        for row in to_insert_dict:
            insert_part.append(f"({",".join(["?"] * len(cols))})")
            args.extend([row[col] for col in cols])
        query_parts.append(",".join(insert_part))

        query_parts.append(";")

        self.execute(
            query=" ".join(query_parts),
            args=tuple(args),
        )

    @overload
    def update(
        self,
        table: str,
        update_col_col: dict[str, str] = dict(),
        update_col_value: dict[str, object] = dict(),
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> None: ...

    @overload
    def update(
        self,
        table: Type[GenericTableModel],
        update_col_col: dict[str, str] = dict(),
        update_col_value: dict[str, object] = dict(),
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> None: ...

    def update(
        self,
        table: str | Type[GenericTableModel],
        update_col_col: dict[str, str] = dict(),
        update_col_value: dict[str, object] = dict(),
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> None:
        """
        Update rows in a database table based on conditions.

        Parameters
        ----------
        table_name : str
            Name of the table to update
        update_col_col : dict[str, str], optional
            Dictionary mapping columns to update with other column values
        update_col_value : dict[str, object], optional
            Dictionary mapping columns to update with specific values
        cond_null : list[str], optional
            Columns that must be NULL
        cond_not_null : list[str], optional
            Columns that must not be NULL
        cond_in : dict[str, list], optional
            Column values that must be in given list
        cond_eq : dict[str, object], optional
            Column values that must equal given value
        cond_neq : dict[str, object], optional
            Column values that must not equal given value
        cond_leq : dict[str, object], optional
            Column values that must be less than or equal to given value
        cond_geq : dict[str, object], optional
            Column values that must be greater than or equal to given value
        cond_l : dict[str, object], optional
            Column values that must be less than given value
        cond_g : dict[str, object], optional
            Column values that must be greater than given value
        """
        table_name = table if isinstance(table, str) else table.__tablename__

        if "updatedAt" in update_col_col:
            del update_col_col["updatedAt"]
        if "updatedAt" in update_col_value:
            del update_col_value["updatedAt"]
        if "createdAt" in update_col_col:
            del update_col_col["createdAt"]
        if "createdAt" in update_col_value:
            del update_col_value["createdAt"]

        if not update_col_col and not update_col_value:
            raise SqliteNoUpdateValuesError()

        for col in update_col_col:
            if col in update_col_value:
                raise (SqliteDuplicateColumnUpdateError(column=col))
        for col in update_col_value:
            if col in update_col_col:
                raise (SqliteDuplicateColumnUpdateError(column=col))

        ids_to_update = self.select(
            table=table_name,
            select_col=["id"],
            cond_equal=cond_equal,
            cond_greater=cond_greater,
            cond_greater_or_eq=cond_greater_or_eq,
            cond_in=cond_in,
            cond_less=cond_less,
            cond_less_or_eq=cond_less_or_eq,
            cond_non_equal=cond_non_equal,
            cond_not_null=cond_not_null,
            cond_null=cond_null,
        )
        ids_to_update_ls = [str(dt["id"]) for dt in ids_to_update]

        if not ids_to_update:
            self.logger.info("nothing to update")
            return

        args = list()
        query_parts = [f"UPDATE {table_name} SET"]

        query_set_part = list()
        for col_prev, col_new in update_col_col.items():
            query_set_part.append(f"{col_prev} = {col_new}")
        for col, value in update_col_value.items():
            query_set_part.append(f"{col} = ?")
            args.append(value)
        query_parts.append(", ".join(query_set_part))

        query_parts.append(f"WHERE id IN ({','.join(['?']*len(ids_to_update_ls))})")
        args.extend(ids_to_update_ls)

        query_parts.append(";")

        self.execute(query=" ".join(query_parts), args=tuple(args))

    @overload
    def update_by_id(
        self,
        table: str,
        id: str,
        update_col_col: dict[str, str] = dict(),
        update_col_value: dict[str, object] = dict(),
    ) -> None: ...

    @overload
    def update_by_id(
        self,
        table: Type[GenericTableModel],
        id: str,
        update_col_col: dict[str, str] = dict(),
        update_col_value: dict[str, object] = dict(),
    ) -> None: ...

    def update_by_id(
        self,
        table: str | Type[GenericTableModel],
        id: str,
        update_col_col: dict[str, str] = dict(),
        update_col_value: dict[str, object] = dict(),
    ) -> None:
        """
        Update a single row in a table by its ID.

        Parameters
        ----------
        table_name : str
            Name of the table to update
        id : str
            ID of the row to update
        update_col_col : dict[str, str], optional
            Dictionary mapping columns to update with other column values
        update_col_value : dict[str, object], optional
            Dictionary mapping columns to update with specific values
        """
        if not self.id_exists(table=table, id=id):
            raise SqliteIdNotFoundError(
                f"{id=} not found during update in table {table if isinstance(table, str) else table.__tablename__}"
            )
        self.update(
            table=table,
            update_col_col=update_col_col,
            update_col_value=update_col_value,
            cond_equal={"id": id},
        )

    @overload
    def delete(
        self,
        table: str,
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> list[dict[str, object]]: ...

    @overload
    def delete(
        self,
        table: Type[GenericTableModel],
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> list[GenericTableModel]: ...

    def delete(
        self,
        table: str | Type[GenericTableModel],
        cond_null: list[str] = list(),
        cond_not_null: list[str] = list(),
        cond_in: dict[str, list] = dict(),
        cond_equal: dict[str, object] = dict(),
        cond_non_equal: dict[str, object] = dict(),
        cond_less_or_eq: dict[str, object] = dict(),
        cond_greater_or_eq: dict[str, object] = dict(),
        cond_less: dict[str, object] = dict(),
        cond_greater: dict[str, object] = dict(),
    ) -> list[dict[str, object]] | list[GenericTableModel]:
        """
        Delete rows from a database table based on conditions and returns them.

        Parameters
        ----------
        table : str | Type[T]
            Table name or actual table class to query from
        cond_null : list[str], optional
            Columns that must be NULL
        cond_not_null : list[str], optional
            Columns that must not be NULL
        cond_in : dict[str, list], optional
            Column values that must be in given list
        cond_eq : dict[str, object], optional
            Column values that must equal given value
        cond_neq : dict[str, object], optional
            Column values that must not equal given value
        cond_leq : dict[str, object], optional
            Column values that must be less than or equal to given value
        cond_geq : dict[str, object], optional
            Column values that must be greater than or equal to given value
        cond_l : dict[str, object], optional
            Column values that must be less than given value
        cond_g : dict[str, object], optional
            Column values that must be greater than given value

        Returns
        -------
        tuple
            Deleted rows as a tuple of dictionaries or actual class if given
        """
        res_Sql = self.select(
            table=table,
            cond_equal=cond_equal,
            cond_greater=cond_greater,
            cond_greater_or_eq=cond_greater_or_eq,
            cond_in=cond_in,
            cond_less=cond_less,
            cond_less_or_eq=cond_less_or_eq,
            cond_non_equal=cond_non_equal,
            cond_not_null=cond_not_null,
            cond_null=cond_null,
        )
        if isinstance(table, str):
            ids_to_delete_ls: list[str] = [str(dt["id"]) for dt in res_Sql]  # type: ignore
        else:
            ids_to_delete_ls: list[str] = [r.id for r in res_Sql]  # type: ignore

        if not ids_to_delete_ls:
            self.logger.info("nothing to update")
            return list()

        if isinstance(table, str):
            query_parts = [f"DELETE FROM {table}"]
        else:
            query_parts = [f"DELETE FROM {table.__tablename__}"]

        query_parts.append(f"WHERE id IN ({", ".join(["?"]*len(ids_to_delete_ls))})")
        query_parts.append(";")

        self.execute(query=" ".join(query_parts), args=tuple(ids_to_delete_ls))
        return res_Sql

    @overload
    def delete_by_id(self, table: str, id: str) -> dict[str, object]: ...

    @overload
    def delete_by_id(
        self, table: Type[GenericTableModel], id: str
    ) -> GenericTableModel: ...

    def delete_by_id(
        self, table: str | Type[GenericTableModel], id: str
    ) -> dict[str, object] | GenericTableModel:
        """
        Delete a row from a database table by its ID.

        Parameters
        ----------
        table : str | Type[T]
            Table name or actual table class to query from
        id : str
            ID of the row to delete

        Returns
        -------
        dict[str, object] | T
            Deleted row as a dictionnary or actual class if given
        """
        res_Sql = self.delete(table=table, cond_equal={"id": id})

        if not res_Sql:
            raise SqliteIdNotFoundError(
                f"{id=} not found during delete in table {table if isinstance(table, str) else table.__tablename__}"
            )
        return res_Sql[0]
