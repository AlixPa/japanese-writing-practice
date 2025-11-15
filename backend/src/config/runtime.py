import os
from dataclasses import dataclass

USES_LOCAL_FILES = os.environ.get("USES_LOCAL_FILES") == "True"
SYNC_DB_S3 = os.environ.get("SYNC_DB_S3") == "True"
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")


@dataclass(frozen=True)
class ServiceEnv:
    local: str = "local"
    production: str = "production"


service_env = ServiceEnv()
