import json
import logging
import sys

from asgi_correlation_id import correlation_id
from src.config.env_var import ENV
from src.config.formats import datetime_format
from src.config.runtime import service_env


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, datetime_format.sql_datetime),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": correlation_id.get() or "unknown",
        }
        return json.dumps(log_record)


class LocalFormatter(logging.Formatter):
    def format(self, record):
        LOG_COlORS = {
            "DEBUG": "\033[94m",  # Blue
            "INFO": "\033[92m",  # Green
            "WARNING": "\033[93m",  # Yellow
            "ERROR": "\033[91m",  # Red
            "CRITICAL": "\033[41;97m",  # White on red
        }
        RESET_COLOR = "\033[0m"

        timestamp = self.formatTime(record, datetime_format.sql_datetime)
        level = record.levelname
        color = LOG_COlORS.get(level, "")
        logger = record.name
        message = record.getMessage()
        correlationId = correlation_id.get() or "unknown"

        log_record = f"\n{color}{timestamp}\n{level} from {logger}:{correlationId=}\n{message}{RESET_COLOR}"

        return log_record


def get_logger(name: str = "AGE_backend_logger", env: str = ENV):
    logger = logging.getLogger(name)
    if env == service_env.production:
        logger.setLevel(logging.INFO)
    else:
        logger.setLevel(logging.DEBUG)

    if not logger.hasHandlers():
        handler = logging.StreamHandler(sys.stdout)
        if env == service_env.production:
            handler.setFormatter(JsonFormatter())
        else:
            handler.setFormatter(LocalFormatter())
        logger.addHandler(handler)

    return logger
