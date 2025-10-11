from dataclasses import dataclass


@dataclass
class DateTimeFormat:
    iso_8601_date: str = "%Y-%m-%d"
    iso_8601_utc: str = "%Y-%m-%dT%H:%M:%SZ"
    sql_datetime: str = "%Y-%m-%d %H:%M:%S"


datetime_format = DateTimeFormat()
