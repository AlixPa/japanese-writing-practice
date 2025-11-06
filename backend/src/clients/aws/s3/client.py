from logging import Logger
from pathlib import Path

import boto3
from src.config.env_var import aws_config
from src.logger import get_logger


class S3Client:
    def __init__(self, logger: Logger | None = None) -> None:
        self.logger = logger or get_logger("S3Client-logger")
        self.client = boto3.client(
            service_name="s3",
            aws_access_key_id=aws_config.access_key,
            aws_secret_access_key=aws_config.secret_access_key,
        )

    def upload_file(
        self,
        src_filepath: Path,
        bucket: str,
        key_prefix: str,
        dst_filename: str | None = None,
    ) -> None:
        """
        Uploads a file to s3.
        If no dst_filename is provided, dst_filename will be same as the one as src_filepath.name
        """
        self.client.upload_file(
            Filename=str(src_filepath.resolve()),
            Bucket=bucket,
            Key=key_prefix + "/" + (dst_filename or src_filepath.name),
        )

    def download_file(
        self,
        dst_folder: Path,
        s3_filename: str,
        bucket: str,
        key_prefix: str,
        dst_filename: str | None = None,
    ) -> None:
        """
        Uploads a file to s3.
        If no dst_filename is provided, dst_filename will be same as the one as s3_filename
        """
        self.client.download_file(
            Bucket=bucket,
            Key=key_prefix + "/" + s3_filename,
            Filename=str(dst_folder / (dst_filename or s3_filename)),
        )

    def close(self) -> None:
        self.client.close()
