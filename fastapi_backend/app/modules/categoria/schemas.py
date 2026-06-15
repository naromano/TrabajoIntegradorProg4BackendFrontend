from typing import Optional, List
from pydantic import BaseModel
from sqlmodel import SQLModel, Field
from datetime import datetime

class CategoriaCreate(SQLModel):
    parent_id: Optional[int] = None
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None


class CategoriaUpdate(SQLModel):
    parent_id: Optional[int] = None
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None


class CategoriaPublic(SQLModel):
    id: int
    parent_id: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class CategoriaList(SQLModel):
    data: List[CategoriaPublic]
    total: int


class CategoriaTree(BaseModel):
    id: int
    parent_id: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    children: List["CategoriaTree"] = []
