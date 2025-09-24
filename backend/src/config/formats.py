class DateTimeFormat:
    def __init__(self) -> None:
        self.ISO_8601_DATE = "%Y-%m-%d"
        self.ISO_8601_UTC = "%Y-%m-%dT%H:%M:%SZ"
        self.SQL_DATETIME = "%Y-%m-%d %H:%M:%S"


DATETIME_FORMAT = DateTimeFormat()
