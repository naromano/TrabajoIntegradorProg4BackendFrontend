from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operación exitosa"
    data: Optional[T] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SuccessResponse(APIResponse[T]):
    def __init__(self, data: Optional[T] = None, message: str = "Operación exitosa", **kwargs):
        super().__init__(success=True, message=message, data=data, **kwargs)


class ErrorResponse(APIResponse):
    def __init__(self, message: str = "Error en la operación", data: Optional[Any] = None, **kwargs):
        super().__init__(success=False, message=message, data=data, **kwargs)


class ListResponse(BaseModel):
    success: bool = True
    message: str = "Listado obtenido exitosamente"
    data: list = Field(default_factory=list)
    total: int = 0
    skip: int = 0
    limit: int = 10
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

