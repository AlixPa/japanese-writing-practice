import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class S3Buckets:
    japanese_dictation: str = "japanese-dictation"


@dataclass(frozen=True)
class AWSConfig:
    s3_buckets: S3Buckets = field(default_factory=lambda: S3Buckets())
    access_key: str = os.getenv("AWS_ACCESS_KEY", "")
    secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")


aws_config = AWSConfig()
