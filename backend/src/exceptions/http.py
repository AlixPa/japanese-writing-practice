from fastapi import HTTPException
from pydantic import BaseModel
from src.config.env_var import ENV
from src.config.runtime import service_env


class WrongArgumentException(Exception):
    def __init__(self, *args: object) -> None:
        super().__init__(*args)


class HTTPSNotFoundException(HTTPException):
    def __init__(self, detail: str | None = None):
        super().__init__(status_code=404, detail=detail)


class HTTPSqlmodelAlreadyExistsException(HTTPException):
    def __init__(
        self, entity_name: str, entity_bm: BaseModel, detail: str | None = None
    ):
        message = f"{entity_name} already exists"
        entity = entity_bm.model_dump(exclude_unset=True)
        details = {"message": message, "entity": entity}
        if ENV != service_env.production and detail:
            details.update({"detail": detail})
        super().__init__(status_code=409, detail=str(details))


class HTTPWrongAttributesException(HTTPException):
    def __init__(self, detail: str | None = None):
        super().__init__(status_code=400, detail=detail)


class HTTPServerException(HTTPException):
    def __init__(self, detail: str | None = None):
        super().__init__(
            status_code=500, detail=detail if ENV != service_env.production else None
        )
