class SqlNoConnectionError(Exception):
    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail)


class SqlNoValueInsertionError(Exception):
    def __init__(self):
        super().__init__("No value given to insert.")


class SqlColumnInconsistencyError(Exception):
    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail)


class SqlDuplicateColumnUpdateError(Exception):
    def __init__(self, column: str):
        super().__init__(f"Updating multiple time the same column, {column=}")


class SqlNoUpdateValuesError(Exception):
    def __init__(self):
        super().__init__("Nothing given to update.")


class SqlWrongQueryError(Exception):
    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail)


class SqlIdNotFoundError(Exception):
    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail)
