from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime


class DireccionEntregaCreate(SQLModel):
    usuario_id: int = Field(gt=0)
    alias: Optional[str] = Field(default=None, max_length=50)
    linea1: str
    linea2: Optional[str] = None
    ciudad: str = Field(max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    codigo_postal: Optional[str] = Field(default=None, max_length=10)
    es_principal: bool = False


class DireccionEntregaUpdate(SQLModel):
    alias: Optional[str] = Field(default=None, max_length=50)
    linea1: Optional[str] = None
    linea2: Optional[str] = None
    ciudad: Optional[str] = Field(default=None, max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    codigo_postal: Optional[str] = Field(default=None, max_length=10)
    es_principal: Optional[bool] = None


class DireccionEntregaPublic(SQLModel):
    id: int
    usuario_id: int
    alias: Optional[str]
    linea1: str
    linea2: Optional[str]
    ciudad: str
    provincia: Optional[str]
    codigo_postal: Optional[str]
    es_principal: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class DireccionEntregaList(SQLModel):
    data: List[DireccionEntregaPublic]
    total: int