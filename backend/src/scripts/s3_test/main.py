from pathlib import Path

from src.clients.aws import S3Client
from src.config.env_var import S3Buckets, aws_config


def main() -> None:
    s3 = S3Client()
    s3.upload_file(
        src_filepath=Path(__file__).resolve(),
        bucket=S3Buckets.japanese_dictation,
        key_prefix="audio",
    )
    s3.download_file(
        dst_folder=Path(__file__).resolve().parents[0],
        s3_filename="main.py",
        bucket=S3Buckets.japanese_dictation,
        key_prefix="audio",
        dst_filename="mama.py",
    )
    s3.close()
