from fastapi import APIRouter, Depends, status
from src.dependencies.authentification import get_current_user
from src.exceptions.http import (
    HTTPUnAuthorizedException,
    HTTPWrongAttributesException,
    UnAuthorizedException,
    WrongArgumentException,
)
from src.logger import get_logger
from src.models.uuid4str import UUID4Str

from .models import ConfigModel
from .service import add_or_update_config, load_configs, remove_config

router = APIRouter(prefix="/config")
logger = get_logger()


@router.get("", response_model=list[ConfigModel])
async def get_configs(user_id: str = Depends(get_current_user)) -> list[ConfigModel]:
    logger.info(f"On GET /config")

    return await load_configs(user_id)


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def post_config(
    config: ConfigModel, user_id: UUID4Str = Depends(get_current_user)
) -> None:
    logger.info(f"On POST /config, got {config=}")

    try:
        await add_or_update_config(config=config, user_id=user_id)
    except UnAuthorizedException as e:
        raise HTTPUnAuthorizedException(str(e))

    return


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_config(config_id: UUID4Str) -> None:
    logger.info(f"On DELETE /config, with {config_id=}")

    try:
        await remove_config(config_id)
    except WrongArgumentException as e:
        raise HTTPWrongAttributesException(str(e))

    return
