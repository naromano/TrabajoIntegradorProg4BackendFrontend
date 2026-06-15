from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.usuario.models import Usuario


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    token_hash: str = Field(max_length=64, unique=True)
    expires_at: datetime = Field(sa_type=DateTime(timezone=True))
    revoked_at: Optional[datetime] = Field(default=None, sa_type=DateTime(timezone=True))

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )

    usuario: Optional["Usuario"] = Relationship(
        back_populates="refresh_tokens",
        sa_relationship_kwargs={
            "foreign_keys": "[RefreshToken.usuario_id]"
        }
    )
