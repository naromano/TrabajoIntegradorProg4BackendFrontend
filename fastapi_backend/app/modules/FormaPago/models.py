from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.pedido.models import Pedido


class FormaPago(SQLModel, table=True):
    __tablename__ = "forma_pago"

    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: str = Field(max_length=80)
    habilitado: bool = Field(default=True)

    pedidos: List["Pedido"] = Relationship(back_populates="forma_pago")