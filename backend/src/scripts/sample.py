from src.clients.aws import S3Client
from src.clients.sqlite import SQLiteClient
from src.config.aws import aws_config
from src.config.path import path_config
from src.models.database import Configs, Users

japanese_dictation_filename = "japanese_dictation_latest.sqlite"
japanese_dictation_key_prefix = "database"


def main() -> None:
    # sqlite = SQLiteClient()
    # print(sqlite.select(Configs))
    # print(sqlite.select(Users))

    # sqlite.delete_by_id(table=Configs, id="e36e6614-7b11-4096-b658-7c675748e072")
    # sqlite.delete_by_id(table=Users, id="42e0ac0f-94f9-42df-b001-49e4eff56abd")

    s3 = S3Client()
    s3.upload_file(
        src_filepath=path_config.sqlite_db_file,
        bucket=aws_config.s3_buckets.japanese_dictation,
        key_prefix=japanese_dictation_key_prefix,
        dst_filename="japanese_dictation_2025-11-15-14-21.sqlite",
    )
    s3.close()
