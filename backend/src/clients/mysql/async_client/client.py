## NOTE: This client is async and should not be used with scripts, but with FAST API
import traceback
from abc import ABC, abstractmethod
from logging import Logger
from typing import Type, TypeVar, cast, overload
from uuid import uuid4

from sqlalchemy import CursorResult, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from src.config.env_var import mysql_config
from src.logger import get_logger
from src.models.database import BaseTableModel

from .exceptions import (
    AMySqlColumnInconsistencyError,
    AMySqlDuplicateColumnUpdateError,
    AMySqlIdNotFoundError,
    AMySqlNoEngineError,
    AMySqlNoUpdateValuesError,
    AMySqlNoValueInsertionError,
    AMySqlWrongQueryError,
)
from .models import CondReturn

base_logger = get_logger()
engine_reader = None
engine_writer = None


# TODO: Isolated credentials for reading
def _get_engine_reader() -> AsyncEngine:
    global engine_reader
    if engine_reader is None:
        engine_reader = create_async_engine(
            f"mysql+asyncmy://{mysql_config.user}:{mysql_config.password}@{mysql_config.host}:{mysql_config.port}/{mysql_config.database}",
            pool_size=5,
            max_overflow=5,
            pool_timeout=60,
            pool_recycle=1800,
        )
    return engine_reader


# TODO: Isolated credentials for writing
def _get_engine_writer() -> AsyncEngine:
    global engine_writer
    if engine_writer is None:
        engine_writer = create_async_engine(
            f"mysql+asyncmy://{mysql_config.user}:{mysql_config.password}@{mysql_config.host}:{mysql_config.port}/{mysql_config.database}",
            pool_size=5,
            max_overflow=5,
            pool_timeout=60,
            pool_recycle=1800,
        )
    return engine_writer


GenericTableModel = TypeVar("GenericTableModel", bound=BaseTableModel)


class AMysqlClient(ABC):
    def __init__(self, logger: Logger | None = None) -> None:
        self.logger = logger or base_logger
        self.engine: AsyncEngine | None = None

    @abstractmethod
    def _connect(self) -> None:
        """
        Sub-class should overwrite this method with correct credentials.
        """
        pass

    def _logging(self, query: str, args: dict | None, result: CursorResult) -> None:
        if args:
            for key, value in args.items():
                quoted = f"'{value}'" if isinstance(value, str) else str(value)
                query = query.replace(f":{key}", quoted)
        self.logger.debug(f"MysqlClient executed: {query} {result.rowcount=}")

    def _get_uuid4(self) -> str:
        return "id_" + str(uuid4()).replace("-", "_")

    def _update_args_get_uids_sql(
        self, args: dict[str, object], ls_val: list[object]
    ) -> list[str]:
        uids = [self._get_uuid4() for _ in range(len(ls_val))]
        args.update({uid: value for uid, value in zip(uids, ls_val)})
        return [f":{uid}" for uid in uids]

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
    ) -> CondReturn:
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
        args: dict[str, object] = dict()

        for col in cond_null:
            conds.append(f"AND {col} IS NULL")

        for col in cond_not_null:
            conds.append(f"AND {col} IS NOT NULL")

        for col, ls_val in cond_in.items():
            if len(ls_val) == 0:
                # if the val is in "no val" it means it cannot be satisfyied.
                conds.append("AND 1=0")
                continue
            uids_sql = self._update_args_get_uids_sql(args=args, ls_val=ls_val)
            conds.append(f"AND {col} IN (" + ",".join(uids_sql) + ")")

        symbols_colvalues = {
            "=": cond_equal,
            "<>": cond_non_equal,
            "<=": cond_less_or_eq,
            ">=": cond_greater_or_eq,
            "<": cond_less,
            ">": cond_greater,
        }

        for symbol, colvalues in symbols_colvalues.items():
            for col, val in colvalues.items():
                uid = self._get_uuid4()
                conds.append(f"AND {col} {symbol} :{uid}")
                args[uid] = val

        return CondReturn(condition=" ".join(conds), args=args)

    async def execute(
        self, query: str, args: dict[str, object] | None = None
    ) -> list[dict[str, object]]:
        """
        Execute a SQL query and return the results, without commiting (read only).

        Parameters
        ----------
        query : str
            SQL query to execute
        args : tuple | dict | None, optional
            Parameters to pass to the query, by default None

        Returns
        -------
        list
            Results of the query execution

        Raises
        ------
        AMySqlWrongQueryError
            If query is wrong
        AMySqlNoEngineError
            If no database connection exists
        """
        if not self.engine:
            raise AMySqlNoEngineError("Could not execute query, no engine yet.")

        try:
            async with self.engine.connect() as conn:
                result_alchemy = await conn.execute(text(query), args or {})
                rows = result_alchemy.fetchall()
        except ProgrammingError:
            self.logger.warning(
                f"error while executing query, {traceback.format_exc()}"
            )
            raise AMySqlWrongQueryError(f"{traceback.format_exc()}")

        self._logging(query=query, args=args, result=result_alchemy)

        return [dict(r._mapping) for r in rows]

    async def count(
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
        AMySqlWrongQueryError
            If query is wrong
        AMySqlNoEngineError
            If no database connection exists
        """
        query_parts = [
            f"SELECT COUNT({', '.join(select_col) if select_col else '*'}) AS ct FROM {table_name}"
        ]
        cond_ret = self._generate_cond(
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
        cond, args = cond_ret.condition, cond_ret.args

        query_parts.append(cond)
        query_parts.append(";")

        res_mysql = await self.execute(query=" ".join(query_parts), args=args)
        if not res_mysql:
            return None
        res = res_mysql[0].get("ct", None)
        return int(str(res)) if res else None

    @overload
    async def select(
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
    async def select(
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

    async def select(
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

        Raises
        ------
        AMySqlNoEngineError
            If no database connection exists
        AMySqlWrongQueryError
            If query is wrong
        """
        if isinstance(table, str):
            query_parts = [
                f"SELECT {', '.join(select_col) if select_col else '*'} FROM {table}"
            ]
        else:
            query_parts = [f"SELECT * FROM {table.__tablename__}"]
        cond_ret = self._generate_cond(
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
        cond, args = cond_ret.condition, cond_ret.args

        query_parts.append(cond)

        if order_by:
            query_parts.append(
                f"ORDER BY {order_by} {'ASC' if ascending_order else 'DESC'}"
            )

        if limit > 0:
            query_parts.append(f"LIMIT {limit}")
            query_parts.append(f"OFFSET {offset}")
        query_parts.append(";")
        res_mysql = await self.execute(query=" ".join(query_parts), args=args)

        if isinstance(table, str):
            return res_mysql
        else:
            return [table(**r) for r in res_mysql]  # type: ignore

    @overload
    async def select_by_id(
        self,
        table: str,
        id: str,
        select_col: list[str] = list(),
    ) -> dict[str, object]: ...

    @overload
    async def select_by_id(
        self,
        table: Type[GenericTableModel],
        id: str,
    ) -> GenericTableModel: ...

    async def select_by_id(
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
        AMySqlNoEngineError
            If no database connection exists
        AMySqlWrongQueryError
            If query is wrong
        AMySqlIdNotFoundError
            If id not found in table
        """
        if isinstance(table, str):
            res_mysql = await self.select(
                table=table,
                select_col=select_col,
                cond_equal={"id": id},
            )
        else:
            res_mysql = await self.select(
                table=table,
                cond_equal={"id": id},
            )
        if not res_mysql:
            raise AMySqlIdNotFoundError(
                f"{id=} not found during select in table {table if isinstance(table, str) else table.__tablename__}"
            )
        return res_mysql[0]

    @overload
    async def id_exists(
        self,
        table: str,
        id: str,
    ) -> bool: ...

    @overload
    async def id_exists(
        self,
        table: Type[GenericTableModel],
        id: str,
    ) -> bool: ...

    async def id_exists(
        self,
        table: str | Type[GenericTableModel],
        id: str,
    ) -> bool:
        try:
            await self.select_by_id(table=table, id=id)
            return True
        except AMySqlIdNotFoundError:
            return False


class AMysqlClientReader(AMysqlClient):
    def __init__(self, logger: Logger | None = None) -> None:
        super().__init__(logger)
        self._connect()

    def _connect(self) -> None:
        self.engine = _get_engine_reader()

    async def check_alive(self) -> None:
        try:
            try:
                check_alive_res = await self.execute("select 1;")
            except Exception:
                check_alive_res = None
            if check_alive_res is None:
                self._connect()
            self.logger.info("AMysqlClientReader is alive.")
        except Exception:
            self.logger.critical("ERROR: Lost connection to Database.")
            raise AMySqlNoEngineError("ERROR: Lost connection to Database.")


class AMysqlClientWriter(AMysqlClient):
    def __init__(self, logger: Logger | None = None) -> None:
        super().__init__(logger)
        self._connect()

    def _connect(self) -> None:
        self.engine = _get_engine_writer()

    async def execute(
        self, query: str, args: dict[str, object] | None = None
    ) -> list[dict[str, object]]:
        """
        Opens a transaction, execute a SQL query, commit and return the results.

        Parameters
        ----------
        query : str
            SQL query to execute
        args : tuple | dict | None, optional
            Parameters to pass to the query, by default None

        Returns
        -------
        list
            Results of the query execution

        Raises
        ------
        AMySqlWrongQueryError
            If query is wrong
        AMySqlNoEngineError
            If no database connection exists
        """
        if not self.engine:
            raise AMySqlNoEngineError("Could not execute query, no engine yet.")

        try:
            async with self.engine.begin() as conn:
                result_alchemy = await conn.execute(text(query), args or {})
                if result_alchemy.returns_rows:
                    rows = result_alchemy.fetchall()
                else:
                    rows = list()
        except ProgrammingError:
            self.logger.warning(
                f"error while executing query, {traceback.format_exc()}"
            )
            raise AMySqlWrongQueryError(f"{traceback.format_exc()}")

        self._logging(query=query, args=args, result=result_alchemy)

        return [dict(r._mapping) for r in rows]

    @overload
    async def insert_one(
        self,
        table: str,
        to_insert: dict[str, object],
        or_ignore=False,
    ) -> None: ...

    @overload
    async def insert_one(
        self,
        table: Type[GenericTableModel],
        to_insert: GenericTableModel,
        or_ignore=False,
    ) -> None: ...

    async def insert_one(
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
        AMySqlNoValueInsertionError
            If values dictionary is empty
        AMySqlNoEngineError
            If no database connection exists
        AMySqlWrongQueryError
            If query is wrong
        """
        # For typing
        if isinstance(table, str):
            to_insert = cast(dict[str, object], to_insert)
            return await self.insert(
                table=table,
                to_insert=[to_insert],
                or_ignore=or_ignore,
            )
        else:
            to_insert = cast(GenericTableModel, to_insert)
            return await self.insert(
                table=table,
                to_insert=[to_insert],
                or_ignore=or_ignore,
            )

    @overload
    async def insert(
        self,
        table: str,
        to_insert: list[dict[str, object]],
        or_ignore=False,
    ) -> None: ...

    @overload
    async def insert(
        self,
        table: Type[GenericTableModel],
        to_insert: list[GenericTableModel],
        or_ignore=False,
    ) -> None: ...

    async def insert(
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
        AMySqlNoValueInsertionError
            If values dictionary is empty
        AMySqlNoEngineError
            If no database connection exists
        AMySqlWrongQueryError
            If query is wrong
        AMySqlColumnInconsistencyError
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
            raise AMySqlNoValueInsertionError()

        cols = set(to_insert_dict[0].keys())
        for row in to_insert_dict:
            for col in cols:
                if not col in row:
                    raise AMySqlColumnInconsistencyError(
                        f"{col=} is not in one of the row to insert: {row=}"
                    )
            for col in row:
                if not col in cols:
                    raise AMySqlColumnInconsistencyError(
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
        args: dict[str, object] = dict()
        for row in to_insert_dict:
            values = [row[col] for col in cols]
            uids_sql = self._update_args_get_uids_sql(args=args, ls_val=values)
            insert_part.append(f"({",".join(uids_sql)})")
        query_parts.append(",".join(insert_part))

        query_parts.append(";")

        await self.execute(
            query=" ".join(query_parts),
            args=args,
        )

    @overload
    async def update(
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
    async def update(
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

    async def update(
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
        AMySqlNoEngineError
            If no database connection exists
        AMySqlDuplicateColumnUpdateError
            If a column appears in both update_col_col and update_col_value
        AMySqlWrongQueryError
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
            raise AMySqlNoUpdateValuesError()

        for col in update_col_col:
            if col in update_col_value:
                raise (AMySqlDuplicateColumnUpdateError(column=col))
        for col in update_col_value:
            if col in update_col_col:
                raise (AMySqlDuplicateColumnUpdateError(column=col))

        ids_to_update = await self.select(
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
        ids_to_update_ls: list[object] = [str(dt["id"]) for dt in ids_to_update]

        if not ids_to_update:
            self.logger.info("nothing to update")
            return

        query_parts = [f"UPDATE {table_name} SET"]
        args: dict[str, object] = dict()

        query_set_part = list()
        for col_prev, col_new in update_col_col.items():
            query_set_part.append(f"{col_prev} = {col_new}")
        for col, value in update_col_value.items():
            uid = self._get_uuid4()
            query_set_part.append(f"{col} = :{uid}")
            args[uid] = value
        query_parts.append(", ".join(query_set_part))

        uids_sql = self._update_args_get_uids_sql(args=args, ls_val=ids_to_update_ls)
        query_parts.append(f"WHERE id IN ({','.join(uids_sql)})")

        query_parts.append(";")

        await self.execute(query=" ".join(query_parts), args=args)

    @overload
    async def update_by_id(
        self,
        table: str,
        id: str,
        update_col_col: dict[str, str] = dict(),
        update_col_value: dict[str, object] = dict(),
    ) -> None: ...

    @overload
    async def update_by_id(
        self,
        table: Type[GenericTableModel],
        id: str,
        update_col_col: dict[str, str] = dict(),
        update_col_value: dict[str, object] = dict(),
    ) -> None: ...

    async def update_by_id(
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
        AMySqlNoEngineError
            If no database connection exists
        AMySqlDuplicateColumnUpdateError
            If a column appears in both update_col_col and update_col_value
        AMySqlWrongQueryError
            If query is wrong
        AMySqlIdNotFoundError
            If id not found in table
        """
        if not await self.id_exists(table=table, id=id):
            raise AMySqlIdNotFoundError(
                f"{id=} not found during update in table {table if isinstance(table, str) else table.__tablename__}"
            )
        await self.update(
            table=table,
            update_col_col=update_col_col,
            update_col_value=update_col_value,
            cond_equal={"id": id},
        )

    @overload
    async def delete(
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
    async def delete(
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

    async def delete(
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

        Raises
        ------
        AMySqlNoEngineError
            If no database connection exists
        AMySqlWrongQueryError
            If query is wrong
        """
        res_mysql = await self.select(
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
            ids_to_delete_ls: list[object] = [str(dt["id"]) for dt in res_mysql]  # type: ignore
        else:
            ids_to_delete_ls: list[object] = [r.id for r in res_mysql]  # type: ignore

        if not ids_to_delete_ls:
            self.logger.info("nothing to update")
            return list()

        if isinstance(table, str):
            query_parts = [f"DELETE FROM {table}"]
        else:
            query_parts = [f"DELETE FROM {table.__tablename__}"]

        args: dict[str, object] = dict()
        uids_sql = self._update_args_get_uids_sql(args=args, ls_val=ids_to_delete_ls)
        query_parts.append(f"WHERE id IN ({", ".join(uids_sql)})")
        query_parts.append(";")

        await self.execute(query=" ".join(query_parts), args=args)
        return res_mysql

    @overload
    async def delete_by_id(self, table: str, id: str) -> dict[str, object]: ...

    @overload
    async def delete_by_id(
        self, table: Type[GenericTableModel], id: str
    ) -> GenericTableModel: ...

    async def delete_by_id(
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
        AMySqlNoEngineError
            If no database connection exists
        AMySqlWrongQueryError
            If query is wrong
        AMySqlIdNotFoundError
            If id not found in table
        """
        res_mysql = await self.delete(table=table, cond_equal={"id": id})

        if not res_mysql:
            raise AMySqlIdNotFoundError(
                f"{id=} not found during delete in table {table if isinstance(table, str) else table.__tablename__}"
            )
        return res_mysql[0]
