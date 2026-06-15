from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime

class IngredienteCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = None
    es_alergeno: bool = False
    stock_cantidad: float = Field(default=0, ge=0)
    costo: float = Field(default=0, ge=0)
    imagen_url: Optional[str] = None
    unidad_medida_id: Optional[int] = None


class IngredienteUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = None
    es_alergeno: Optional[bool] = None
    stock_cantidad: Optional[float] = Field(default=None, ge=0)
    costo: Optional[float] = Field(default=None, ge=0)
    imagen_url: Optional[str] = None
    unidad_medida_id: Optional[int] = None
    activo: Optional[bool] = None


class IngredientePublic(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    es_alergeno: bool
    stock_cantidad: float
    costo: float
    imagen_url: Optional[str] = None
    unidad_medida_id: Optional[int] = None
    activo: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class IngredienteList(SQLModel):
    data: List[IngredientePublic]
    total: int

