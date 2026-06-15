from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Numeric, DateTime, BigInteger
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.Pedido.models import Pedido

class Pago(SQLModel, table=True):
    __tablename__ = "pago"

    id: Optional[int] = Field(default=None, primary_key=True)

    pedido_id: int = Field(foreign_key="pedido.id")
    mp_payment_id: Optional[int] = Field(default=None, unique=True, sa_type=BigInteger)
    mp_preference_id: Optional[str] = Field(default=None, max_length=100)
    mp_init_point: Optional[str] = Field(default=None, max_length=500)
    mp_status: str = Field(max_length=30, default="pending")
    mp_status_detail: Optional[str] = Field(default=None, max_length=100)
    external_reference: str = Field(unique=True, max_length=100)
    idempotency_key: str = Field(unique=True, max_length=100)
    transaction_amount: float = Field(sa_type=Numeric(10, 2))
    payment_method_id: Optional[str] = Field(default=None, max_length=50)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )

    pedido: Optional["Pedido"] = Relationship(back_populates="pagos")