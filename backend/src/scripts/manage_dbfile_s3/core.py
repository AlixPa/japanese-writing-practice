from src.clients.aws import S3Client
from src.config.path import path_config
from src.config.aws import aws_config
import time


def load_sqlite_file() -> None:
    s3 = S3Client()
    s3.download_file(
        dst_folder=path_config.sqlite_db.parents[0],
        bucket=aws_config.s3_buckets.japanese_dictation,
        s3_filename="japanese_dictation.sqlite",
        key_prefix="database",
        dst_filename=path_config.sqlite_db.name,
    )
    s3.close()


def save_sqlite_file() -> None:
    s3 = S3Client()
    s3.upload_file(
        src_filepath=path_config.sqlite_db,
        bucket=aws_config.s3_buckets.japanese_dictation,
        key_prefix="database/saves",
        dst_filename=f"japanese_dictation_{int(time.time()*1000)}.sqlite",
    )
    s3.close()
