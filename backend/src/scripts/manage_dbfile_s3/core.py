from datetime import datetime

from src.clients.aws import S3Client
from src.config.aws import aws_config
from src.config.path import path_config
from src.logger import get_logger

japanese_dictation_filename = "japanese_dictation_latest.sqlite"
japanese_dictation_key_prefix = "database"
logger = get_logger()


def load_sqlite_file(custom_file_name: str | None = None) -> None:
    s3 = S3Client()
    s3.download_file(
        dst_folder=path_config.sqlite_db_file.parents[0],
        bucket=aws_config.s3_buckets.japanese_dictation,
        s3_filename=custom_file_name or japanese_dictation_filename,
        key_prefix=japanese_dictation_key_prefix,
        dst_filename=path_config.sqlite_db_file.name,
    )
    s3.close()
    logger.info(f"Sqlite file downloaded from s3. {datetime.now()=}")


def save_sqlite_file() -> None:
    s3 = S3Client()
    s3.upload_file(
        src_filepath=path_config.sqlite_db_file,
        bucket=aws_config.s3_buckets.japanese_dictation,
        key_prefix=japanese_dictation_key_prefix,
        dst_filename=japanese_dictation_filename,
    )
    s3.close()
    logger.info(f"Sqlite file uploaded to s3. {datetime.now()=}")
