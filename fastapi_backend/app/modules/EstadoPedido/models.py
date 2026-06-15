from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime
from datetime import datetime

if TYPE_CHECKING:
    from app.modules.pedido.models import Pedido, HistorialEstadoPedido


class EstadoPedido(SQLModel, table=True):
    __tablename__ = "estado_pedido"

    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: Optional[str] = Field(max_length=80)
    orden: int = Field(default=0)
    es_terminal: bool = Field(default=False)


    pedidos: List["Pedido"] = Relationship(back_populates="estado_pedido")
    
    historial_desde: List["HistorialEstadoPedido"] = Relationship(
        back_populates="estado_desde",
        sa_relationship_kwargs={
            "foreign_keys": "[HistorialEstadoPedido.estado_desde_codigo]"
        }
    )

    historial_hacia: List["HistorialEstadoPedido"] = Relationship(
        back_populates="estado_hacia",
        sa_relationship_kwargs={
            "foreign_keys": "[HistorialEstadoPedido.estado_hacia_codigo]"
        }
    )
