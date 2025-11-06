from src.clients.aws import S3Client
from src.config.env_var import S3Buckets


def main() -> None:
    s3 = S3Client()
    print(
        s3.presigned_url(
            bucket=S3Buckets.japanese_dictation,
            prefix="audio",
            filename="00265ca9-1a2e-4506-a109-a633a03d8feb.wav",
            expires_in_s=2,
        )
    )
