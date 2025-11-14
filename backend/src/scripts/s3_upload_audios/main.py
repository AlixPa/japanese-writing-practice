import os

from src.clients.aws import S3Client
from src.clients.mysql.sync_client import MysqlClientReader
from src.config.env_var import S3Buckets
from src.config.path import path_config
from src.models.database import AudioTable
from tqdm import tqdm


def main() -> None:
    reader = MysqlClientReader()
    s3 = S3Client()

    res = reader.select(table=AudioTable)

    all_audios = set(os.listdir(path_config.audio / "default"))
    assert len(res) == len(all_audios)
    for r in res:
        if r.url.replace("default/", "") not in all_audios:
            print(r.url)

    for a in tqdm(res):
        s3.upload_file(
            src_filepath=path_config.audio / a.url,
            bucket=S3Buckets.japanese_dictation,
            key_prefix="audio",
        )
