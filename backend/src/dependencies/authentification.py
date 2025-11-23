from functools import lru_cache
from typing import Annotated

from cachetools import TTLCache
from fastapi import Header
from google.auth.transport import requests
from google.oauth2 import id_token
from src.clients.sqlite import SQLiteClient
from src.config.runtime import GOOGLE_CLIENT_ID
from src.logger import get_logger
from src.models.database import Users

base_logger = get_logger()


verified_tokens_cache = TTLCache(maxsize=1000, ttl=300)


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    base_logger.info(f"Got request with {authorization=}")

    if authorization in verified_tokens_cache:
        return verified_tokens_cache[authorization]

    sqlite = SQLiteClient()

    if authorization is None:
        # Default user
        user_id = sqlite.select(table=Users, cond_null=["google_sub"])[0].id
    else:
        # Get google info
        id_info = id_token.verify_oauth2_token(
            authorization, requests.Request(), GOOGLE_CLIENT_ID
        )
        google_sub = id_info["sub"]
        email = id_info.get("email")

        user = sqlite.select(table=Users, cond_equal=dict(google_sub=google_sub))
        if not user:
            sqlite.insert_one(
                table=Users,
                to_insert=Users(email=email, google_sub=google_sub),
            )
            user = sqlite.select(table=Users, cond_equal=dict(google_sub=google_sub))

        user_id = user[0].id

    base_logger.info(f"Continue request for {user_id=}")
    verified_tokens_cache[authorization] = user_id
    return user_id
