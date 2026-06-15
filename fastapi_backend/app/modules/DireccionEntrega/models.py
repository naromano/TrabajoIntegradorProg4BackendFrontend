from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime, Numeric
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.usuario.models import Usuario
    from app.modules.pedido.models import Pedido


class DireccionEntrega(SQLModel, table=True):
    __tablename__ = "direccion_entrega"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    alias: Optional[str] = Field(default=None, max_length=50)
    linea1: str = Field()
    linea2: Optional[str] = Field(default=None)
    ciudad: str = Field(max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    codigo_postal: Optional[str] = Field(default=None, max_length=10)
    es_principal: bool = Field(default=False)

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

    usuario: Optional["Usuario"] = Relationship(back_populates="direcciones")
    pedidos: List["Pedido"] = Relationship(back_populates="direccion")
