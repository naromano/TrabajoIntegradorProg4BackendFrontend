from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime, Numeric
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.usuario.models import Usuario
    from app.modules.DireccionEntrega.models import DireccionEntrega
    from app.modules.EstadoPedido.models import EstadoPedido
    from app.modules.FormaPago.models import FormaPago
    from app.modules.DetallePedido.models import DetallePedido 
    from app.modules.HistorialEstadoPedido.models import HistorialEstadoPedido
    from app.modules.Pago.models import Pago

class Pedido(SQLModel, table=True):
    __tablename__ = "pedido"

    id: Optional[int] = Field(default=None, primary_key=True)

    usuario_id: int = Field(foreign_key="usuario.id")
    direccion_id: Optional[int] = Field(default=None, foreign_key="direccion_entrega.id")
    estado_codigo: str = Field(foreign_key="estado_pedido.codigo", max_length=20)
    forma_pago_codigo: str = Field(foreign_key="forma_pago.codigo", max_length=20)


    subtotal: float = Field(sa_type=Numeric(10, 2))
    descuento: float = Field(default=0.00, sa_type=Numeric(10, 2))
    costo_envio: float = Field(default=50.00, sa_type=Numeric(10, 2))
    total: float = Field(sa_type=Numeric(10, 2))

    notas: Optional[str] = Field(default=None)

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

    usuario: Optional["Usuario"] = Relationship(back_populates="pedidos")
    direccion: Optional["DireccionEntrega"] = Relationship(back_populates="pedidos")
    estado_pedido: Optional["EstadoPedido"] = Relationship(back_populates="pedidos")
    forma_pago: Optional["FormaPago"] = Relationship(back_populates="pedidos")
    detalles: List["DetallePedido"] = Relationship(back_populates="pedido")
    historial: List["HistorialEstadoPedido"] = Relationship(back_populates="pedido")
    pagos: List["Pago"] = Relationship(back_populates="pedido")
