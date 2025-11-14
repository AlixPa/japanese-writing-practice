import os
from dataclasses import dataclass

USES_LOCAL_FILES = os.environ.get("USES_LOCAL_FILES") == "True"


@dataclass(frozen=True)
class ServiceEnv:
    local: str = "local"
    production: str = "production"


service_env = ServiceEnv()
