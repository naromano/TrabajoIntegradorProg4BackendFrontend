from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime, Numeric, ARRAY, Integer, SmallInteger
from datetime import datetime, timezone
 
if TYPE_CHECKING:
    from app.modules.pedido.models import Pedido
    from app.modules.estado_pedido.models import EstadoPedido
    from app.modules.usuario.models import Usuario
 
 
class HistorialEstadoPedido(SQLModel, table=True):
    __tablename__ = "historial_estado_pedido"
 
    id: Optional[int] = Field(default=None, primary_key=True)
 
    pedido_id: int = Field(foreign_key="pedido.id")
    estado_desde_codigo: Optional[str] = Field(
        default=None, foreign_key="estado_pedido.codigo", max_length=20
    )
    estado_hacia_codigo: str = Field(
        foreign_key="estado_pedido.codigo", max_length=20
    )
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
    motivo: Optional[str] = Field(default=None)
 

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )

    pedido: Optional["Pedido"] = Relationship(back_populates="historial")
    estado_desde: Optional["EstadoPedido"] = Relationship(
        back_populates="historial_desde",
        sa_relationship_kwargs={
            "foreign_keys": "[HistorialEstadoPedido.estado_desde_codigo]"
        }
    )
    estado_hacia: Optional["EstadoPedido"] = Relationship(
        back_populates="historial_hacia",
        sa_relationship_kwargs={
            "foreign_keys": "[HistorialEstadoPedido.estado_hacia_codigo]"
        }
    )
    usuario: Optional["Usuario"] = Relationship(back_populates="historial_estados")
