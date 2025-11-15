import os
from dataclasses import dataclass

USES_LOCAL_FILES = os.environ.get("USES_LOCAL_FILES") == "True"
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")


@dataclass(frozen=True)
class ServiceEnv:
    local: str = "local"
    production: str = "production"


service_env = ServiceEnv()
