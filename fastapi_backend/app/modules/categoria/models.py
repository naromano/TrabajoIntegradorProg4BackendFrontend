
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.producto.models import ProductoCategoria


class Categoria(SQLModel, table=True):

    __tablename__ = "categoria"

    id: Optional[int] = Field(default=None, primary_key=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="categoria.id")
    nombre: str = Field(unique=True, max_length=100)
    descripcion: Optional[str] = Field(default=None)
    imagen_url: Optional[str] = Field(default=None)
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

    producto_categorias: List["ProductoCategoria"] = Relationship(
        back_populates="categoria"
    )


    parent: Optional["Categoria"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs=dict(
            remote_side="Categoria.id",
            foreign_keys="[Categoria.parent_id]",
        ),
    )

    children: List["Categoria"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs=dict(
            foreign_keys="[Categoria.parent_id]",
        ),
    )

