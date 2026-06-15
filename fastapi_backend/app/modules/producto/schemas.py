
from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime

class ProductoIngredienteCreateInline(SQLModel):
    ingrediente_id: int = Field(gt=0)
    es_removible: bool = False
    cantidad: float = Field(gt=0)
    unidad_medida_id: Optional[int] = Field(default=None, gt=0)


class ProductoCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: Optional[str] = None
    precio_base: float = Field(gt=0)
    imagenes_url: Optional[List[str]] = Field(default=None)
    disponible: bool = True
    porcentaje_ganancia: Optional[float] = Field(default=None, ge=0)
    stock_cantidad: int = Field(default=0, ge=0)
    unidad_venta_id: Optional[int] = Field(default=None, gt=0)
    categoria_id: int = Field(gt=0)
    es_principal: bool = False
    ingredientes: list["ProductoIngredienteCreateInline"] = Field(default_factory=list)


class ProductoUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=150)
    descripcion: Optional[str] = None
    precio_base: Optional[float] = Field(default=None, gt=0)
    imagenes_url: Optional[List[str]] = None
    disponible: Optional[bool] = None
    porcentaje_ganancia: Optional[float] = Field(default=None, ge=0)
    stock_cantidad: Optional[int] = Field(default=None, ge=0)
    unidad_venta_id: Optional[int] = Field(default=None, gt=0)
    categoria_id: Optional[int] = Field(default=None, gt=0)
    es_principal: Optional[bool] = None
    ingredientes: Optional[List["ProductoIngredienteCreateInline"]] = None


class ProductoIngredientePublicInline(SQLModel):
    ingrediente_id: int
    es_removible: bool
    cantidad: float
    unidad_medida_id: int


class ProductoPublic(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    imagenes_url: Optional[List[str]] = None
    disponible: bool
    porcentaje_ganancia: Optional[float] = None
    stock_cantidad: int = 0
    unidad_venta_id: Optional[int] = None
    costo_total: Optional[float] = None
    categoria_id: Optional[int] = None
    es_principal: bool = False
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    producto_ingredientes: list[ProductoIngredientePublicInline] = []


class ProductoList(SQLModel):
    data: List[ProductoPublic]
    total: int


class ProductoCategoriaCreate(SQLModel):
    producto_id: int = Field(gt=0)
    categoria_id: int = Field(gt=0)
    es_principal: bool = False


class ProductoCategoriaPublic(SQLModel):
    producto_id: int
    categoria_id: int
    es_principal: bool
    created_at: datetime


class ProductoCategoriaList(SQLModel):
    data: List[ProductoCategoriaPublic]
    total: int


class ProductoIngredienteCreate(SQLModel):
    producto_id: int = Field(gt=0)
    ingrediente_id: int = Field(gt=0)
    es_removible: bool = False


class ProductoIngredientePublic(SQLModel):
    producto_id: int
    ingrediente_id: int
    es_removible: bool
    cantidad: float = Field(gt=0)
    unidad_medida_id: int = Field(gt=0)

class ProductoIngredienteList(SQLModel):
    data: List[ProductoIngredientePublic]
    total: int


class DisponibilidadUpdate(SQLModel):
    """Request para cambiar disponibilidad de un producto."""
    disponible: bool


class CostoDesgloseItem(SQLModel):
    ingrediente_id: int
    ingrediente_nombre: str
    cantidad_receta: float
    unidad_receta: str
    costo_unitario: float
    unidad_base: str
    costo_total: float


class CostoProductoResponse(SQLModel):
    producto_id: int
    costo_ingredientes: float
    porcentaje_ganancia: Optional[float] = None
    precio_sugerido: Optional[float] = None
    desglose: list[CostoDesgloseItem] = []