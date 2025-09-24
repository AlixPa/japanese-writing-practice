from fastapi import APIRouter, status
from src.exceptions.http import HTTPWrongAttributesException, WrongArgumentException
from src.logger import get_logger

from .models import ConfigModel
from .service import add_or_update_config, load_configs, remove_config

router = APIRouter(prefix="/config")
logger = get_logger()


@router.get("", response_model=list[ConfigModel])
async def get_configs() -> list[ConfigModel]:
    logger.info(f"On GET /config")

    return await load_configs()


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def post_config(config: ConfigModel) -> None:
    logger.info(f"On POST /config, got {config=}")

    await add_or_update_config(config)

    return


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_config(config_id: str) -> None:
    logger.info(f"On DELETE /config, with {config_id=}")

    try:
        await remove_config(config_id)
    except WrongArgumentException as e:
        raise HTTPWrongAttributesException(str(e))

    return
