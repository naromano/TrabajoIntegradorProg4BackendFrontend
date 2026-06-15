
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime, Column, ARRAY, Integer
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Text as saText
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.categoria.models import Categoria
    from app.modules.ingrediente.models import Ingrediente
    from app.modules.unidadMedida.models import UnidadMedida
    from app.modules.DetallePedido.models import DetallePedido

class Producto(SQLModel, table=True):
    __tablename__ = "producto"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=150, unique=True)
    descripcion: Optional[str] = Field(default=None)
    precio_base: float = Field(gt=0)
    imagenes_url: Optional[List[str]] = Field(
        default=None, sa_type=ARRAY(saText)
    )
    disponible: bool = Field(default=True)
    porcentaje_ganancia: Optional[float] = Field(default=None, ge=0)
    stock_cantidad: int = Field(default=0, ge=0, sa_type=Integer())
    unidad_venta_id: Optional[int] = Field(default=None, foreign_key="unidad_medida.id")

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )
    deleted_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True)
    )

    producto_categorias: List["ProductoCategoria"] = Relationship(
        back_populates="producto"
    )

    producto_ingredientes: List["ProductoIngrediente"] = Relationship(
        back_populates="producto"
    )

    detalles_pedido: List["DetallePedido"] = Relationship(back_populates="producto")

    unidad_venta: Optional["UnidadMedida"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Producto.unidad_venta_id]"}
    )

class ProductoCategoria(SQLModel, table=True):

    __tablename__ = "producto_categoria"

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    es_principal: bool = Field(default=False)


    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )


    producto: Optional["Producto"] = Relationship(back_populates="producto_categorias")
    categoria: Optional["Categoria"] = Relationship(back_populates="producto_categorias")


class ProductoIngrediente(SQLModel, table=True):

    __tablename__ = "producto_ingrediente"

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", primary_key=True)
    es_removible: bool = Field(default=False)
    cantidad: float = Field(gt=0)
    unidad_medida_id: int = Field(foreign_key="unidad_medida.id")

    producto: Optional["Producto"] = Relationship(back_populates="producto_ingredientes")
    ingrediente: Optional["Ingrediente"] = Relationship(back_populates="producto_ingredientes")
    unidad_medida: Optional["UnidadMedida"] = Relationship(back_populates="producto_ingredientes")
