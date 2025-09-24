## NOTE: This client is sync and should not be used with FAST API, but with scripts
import traceback
from abc import ABC, abstractmethod
from logging import Logger
from typing import Type, TypeVar, cast, overload

import pymysql.cursors
from src.config.env_var import (
    MYSQL_DATABASE,
    MYSQL_HOST,
    MYSQL_PASSWORD,
    MYSQL_PORT,
    MYSQL_USER,
)
from src.logger import get_logger
from src.models.database import BaseTableModel

from .exceptions import (
    MySqlColumnInconsistencyError,
    MySqlDuplicateColumnUpdateError,
    MySqlIdNotFoundError,
    MySqlNoConnectionError,
    MySqlNoUpdateValuesError,
    MySqlNoValueInsertionError,
    MySqlWrongQueryError,
)

base_logger = get_logger()
GenericTableModel = TypeVar("GenericTableModel", bound=BaseTableModel)


class MysqlClient(ABC):
    def __init__(self, logger: Logger | None = None) -> None:
        self.logger = logger or base_logger
        self.connection: pymysql.Connection[pymysql.cursors.DictCursor] | None = None

    @abstractmethod
    def _connect(self) -> None:
        """
        Sub-class should overwrite this method with correct credentials.
        """
        pass

    def _logging(self, cursor) -> None:
        self.logger.debug(
            f"MysqlClient executed: {str(cursor._executed)} {cursor.rowcount=}"
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
            The args parameter to give to MysqlClient.execute
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
            conds.append(f"AND {col} IN (" + ",".join(["%s"] * len(ls_val)) + ")")
            args.extend(ls_val)

        for col, val in cond_equal.items():
            conds.append(f"AND {col} = %s")
            args.append(val)

        for col, val in cond_non_equal.items():
            conds.append(f"AND {col} <> %s")
            args.append(val)

        for col, val in cond_less_or_eq.items():
            conds.append(f"AND {col} <= %s")
            args.append(val)

        for col, val in cond_greater_or_eq.items():
            conds.append(f"AND {col} >= %s")
            args.append(val)

        for col, val in cond_less.items():
            conds.append(f"AND {col} < %s")
            args.append(val)

        for col, val in cond_greater.items():
            conds.append(f"AND {col} > %s")
            args.append(val)

        return " ".join(conds), tuple(args)

    def execute(
        self, query: str, args: tuple | dict | None = None
    ) -> tuple[dict[str, object], ...]:
        """
        Execute a SQL query and return the results.

        Parameters
        ----------
        query : str
            SQL query to execute
        args : tuple | dict | None, optional
            Parameters to pass to the query, by default None

        Returns
        -------
        tuple
            Results of the query execution

        Raises
        ------
        NoConnectionError
            If no database connection exists
        MySqlWrongQueryError
            If query is wrong
        MySqlNoConnectionError
            If no database connection exists
        """
        if not self.connection:
            raise MySqlNoConnectionError("Could not execute query, no connection yet.")
        with self.connection.cursor() as cursor:
            try:
                cursor.execute(query=query, args=args)
                res = cursor.fetchall()
            except pymysql.err.ProgrammingError as e:
                self.logger.warning(
                    f"error while executing query, {traceback.format_exc()}"
                )
                raise MySqlWrongQueryError(f"{traceback.format_exc()}")
            self._logging(cursor)
        return res

    def count(
        self,
        table_name: str,
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
        table_name : str
            Name of the table to query
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

        Raises
        ------
        MySqlWrongQueryError
            If query is wrong
        MySqlNoConnectionError
            If no database connection exists
        """
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

        res_mysql = self.execute(query=" ".join(query_parts), args=args)
        if not res_mysql:
            return None
        res = res_mysql[0].get("ct", None)
        return int(str(res)) if res else None

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
    ) -> tuple[dict[str, object], ...]: ...

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
    ) -> tuple[GenericTableModel, ...]: ...

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
    ) -> tuple[dict[str, object], ...] | tuple[GenericTableModel, ...]:
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

        Raises
        ------
        MySqlNoConnectionError
            If no database connection exists
        MySqlWrongQueryError
            If query is wrong
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
        res_mysql = self.execute(query=" ".join(query_parts), args=args)
        if isinstance(table, str):
            return res_mysql
        else:
            return tuple(table(**r) for r in res_mysql)  # type: ignore

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

        Raises
        ------
        MySqlNoConnectionError
            If no database connection exists
        MySqlWrongQueryError
            If query is wrong
        MySqlIdNotFoundError
            If id not found in table
        """
        if isinstance(table, str):
            res_mysql = self.select(
                table=table,
                select_col=select_col,
                cond_equal={"id": id},
            )
        else:
            res_mysql = self.select(
                table=table,
                cond_equal={"id": id},
            )
        if not res_mysql:
            raise MySqlIdNotFoundError(
                f"{id=} not found during select in table {table if isinstance(table, str) else table.__tablename__}"
            )
        return res_mysql[0]

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
        except MySqlIdNotFoundError:
            return False


class MysqlClientReader(MysqlClient):
    def __init__(self, logger: Logger | None = None) -> None:
        super().__init__(logger)
        self._connect()

    def _connect(self) -> None:
        ## TODO : Have a MYSQL_USER_WRITER and MYSQL_USER_READER
        self.connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            passwd=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )

    def check_alive(self) -> None:
        try:
            try:
                check_alive_res = self.execute("select 1;")
            except Exception:
                check_alive_res = None
            if check_alive_res is None:
                self._connect()
            self.logger.info("MysqlClientReader is alive.")
        except Exception:
            self.logger.critical("ERROR: Lost connection to Database.")
            raise MySqlNoConnectionError("ERROR: Lost connection to Database.")

    def close(self) -> None:
        if self.connection:
            self.connection.close()


class MysqlClientWriter(MysqlClient):
    def __init__(self, logger: Logger | None = None) -> None:
        super().__init__(logger)

    def _connect(self) -> None:
        ## TODO : Have a MYSQL_USER_WRITER and MYSQL_USER_READER
        self.connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            passwd=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )

    def start_transaction(self) -> None:
        self._connect()

    def commit(self) -> None:
        """
        Commits the transaction and close the connection.
        """
        if not self.connection:
            raise MySqlNoConnectionError("Cannot commit if transaction is closed.")
        self.connection.commit()
        self.connection.close()

    def rollback(self) -> None:
        """
        Rollback the transaction and close the connection.
        """
        if not self.connection:
            raise MySqlNoConnectionError("Cannot commit if transaction is closed.")
        self.connection.rollback()
        self.connection.close()

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

        Raises
        ------
        MySqlNoValueInsertionError
            If values dictionary is empty
        MySqlNoConnectionError
            If no database connection exists
        MySqlWrongQueryError
            If query is wrong
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

        Raises
        ------
        MySqlNoValueInsertionError
            If values dictionary is empty
        MySqlNoConnectionError
            If no database connection exists
        MySqlWrongQueryError
            If query is wrong
        MySqlColumnInconsistencyError
            If multiple rows have individually different columns
        """
        if isinstance(table, str):
            to_insert_dict = cast(list[dict[str, object]], to_insert)
        else:
            to_insert = cast(list[GenericTableModel], to_insert)
            to_insert_dict = [e.to_dict() for e in to_insert]

        for row in to_insert_dict:
            if "createdAt" in row:
                del row["createdAt"]
            if "updatedAt" in row:
                del row["updatedAt"]

        to_insert_dict = [row for row in to_insert_dict if row]
        if not to_insert_dict:
            raise MySqlNoValueInsertionError()

        cols = set(to_insert_dict[0].keys())
        for row in to_insert_dict:
            for col in cols:
                if not col in row:
                    raise MySqlColumnInconsistencyError(
                        f"{col=} is not in one of the row to insert: {row=}"
                    )
            for col in row:
                if not col in cols:
                    raise MySqlColumnInconsistencyError(
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
            insert_part.append(f"({",".join(["%s"] * len(cols))})")
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

        Raises
        ------
        MySqlNoConnectionError
            If no database connection exists
        MySqlDuplicateColumnUpdateError
            If a column appears in both update_col_col and update_col_value
        MySqlWrongQueryError
            If query is wrong
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
            raise MySqlNoUpdateValuesError()

        for col in update_col_col:
            if col in update_col_value:
                raise (MySqlDuplicateColumnUpdateError(column=col))
        for col in update_col_value:
            if col in update_col_col:
                raise (MySqlDuplicateColumnUpdateError(column=col))

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
            query_set_part.append(f"{col} = %s")
            args.append(value)
        query_parts.append(", ".join(query_set_part))

        query_parts.append(f"WHERE id IN ({','.join(['%s']*len(ids_to_update_ls))})")
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

        Raises
        ------
        MySqlNoConnectionError
            If no database connection exists
        MySqlDuplicateColumnUpdateError
            If a column appears in both update_col_col and update_col_value
        MySqlWrongQueryError
            If query is wrong
        MySqlIdNotFoundError
            If id not found in table
        """
        if not self.id_exists(table=table, id=id):
            raise MySqlIdNotFoundError(
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
    ) -> tuple[dict[str, object], ...]: ...

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
    ) -> tuple[GenericTableModel, ...]: ...

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
    ) -> tuple[dict[str, object], ...] | tuple[GenericTableModel, ...]:
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

        Raises
        ------
        MySqlNoConnectionError
            If no database connection exists
        MySqlWrongQueryError
            If query is wrong
        """
        res_mysql = self.select(
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
            ids_to_delete_ls: list[str] = [str(dt["id"]) for dt in res_mysql]  # type: ignore
        else:
            ids_to_delete_ls: list[str] = [r.id for r in res_mysql]  # type: ignore

        if not ids_to_delete_ls:
            self.logger.info("nothing to update")
            return tuple()

        if isinstance(table, str):
            query_parts = [f"DELETE FROM {table}"]
        else:
            query_parts = [f"DELETE FROM {table.__tablename__}"]

        query_parts.append(f"WHERE id IN ({", ".join(["%s"]*len(ids_to_delete_ls))})")
        query_parts.append(";")

        self.execute(query=" ".join(query_parts), args=tuple(ids_to_delete_ls))
        return res_mysql

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

        Raises
        ------
        MySqlNoConnectionError
            If no database connection exists
        MySqlWrongQueryError
            If query is wrong
        MySqlIdNotFoundError
            If id not found in table
        """
        res_mysql = self.delete(table=table, cond_equal={"id": id})

        if not res_mysql:
            raise MySqlIdNotFoundError(
                f"{id=} not found during delete in table {table if isinstance(table, str) else table.__tablename__}"
            )
        return res_mysql[0]
