
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.producto.models import Producto, ProductoIngrediente
    from app.modules.unidadMedida.models import UnidadMedida


class Ingrediente(SQLModel, table=True):
    __tablename__ = "ingrediente"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, max_length=100)
    descripcion: Optional[str] = Field(default=None)
    es_alergeno: bool = Field(default=False)
    stock_cantidad: int = Field(default=0, ge=0)
    costo: float = Field(default=0, ge=0, description="Costo por 1 unidad base (kg/L/u)")
    imagen_url: Optional[str] = Field(default=None)
    unidad_medida_id: Optional[int] = Field(default=None, foreign_key="unidad_medida.id")
    activo: bool = Field(default=True)

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

    producto_ingredientes: List["ProductoIngrediente"] = Relationship(
        back_populates="ingrediente"
    )

    unidad_medida: Optional["UnidadMedida"] = Relationship(
        back_populates="ingredientes"
    )

