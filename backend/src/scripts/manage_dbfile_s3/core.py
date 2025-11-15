from src.clients.aws import S3Client
from src.config.aws import aws_config
from src.config.path import path_config

japanese_dictation_filename = "japanese_dictation_latest.sqlite"
japanese_dictation_key_prefix = "database"


def load_sqlite_file() -> None:
    s3 = S3Client()
    s3.download_file(
        dst_folder=path_config.sqlite_db_file.parents[0],
        bucket=aws_config.s3_buckets.japanese_dictation,
        s3_filename=japanese_dictation_filename,
        key_prefix=japanese_dictation_key_prefix,
        dst_filename=path_config.sqlite_db_file.name,
    )
    s3.close()


def save_sqlite_file() -> None:
    s3 = S3Client()
    s3.upload_file(
        src_filepath=path_config.sqlite_db_file,
        bucket=aws_config.s3_buckets.japanese_dictation,
        key_prefix=japanese_dictation_key_prefix,
        dst_filename=japanese_dictation_filename,
    )
    s3.close()
