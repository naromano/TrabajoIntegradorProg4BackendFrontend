from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime, Column
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime, timezone

if TYPE_CHECKING:
     from app.modules.rol.models import Rol
     from app.modules.auth.models import RefreshToken


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=80)
    apellido: str = Field(max_length=80)
    email: str = Field(unique=True, max_length=254)
    celular: Optional[str] = Field(default=None, max_length=20)
    password_hash: str = Field(max_length=255)
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

    roles: List["UsuarioRol"] = Relationship(
    back_populates="usuario",
    sa_relationship_kwargs={
        "foreign_keys": "[UsuarioRol.usuario_id]"
    }
    )

    roles_asignados: List["UsuarioRol"] = Relationship(
    back_populates="asignado_por",
    sa_relationship_kwargs={
        "foreign_keys": "[UsuarioRol.asignado_por_id]"
    }
    )

    direcciones: List["DireccionEntrega"] = Relationship(back_populates="usuario")
    historial_estados: List["HistorialEstadoPedido"] = Relationship(back_populates="usuario")
    pedidos: List["Pedido"] = Relationship(back_populates="usuario")
    refresh_tokens: List["RefreshToken"] = Relationship(
        back_populates="usuario",
        sa_relationship_kwargs={
            "foreign_keys": "[RefreshToken.usuario_id]"
        }
    )


class UsuarioRol(SQLModel, table=True):
    __tablename__ = "usuario_rol"

    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    rol_codigo: str = Field(foreign_key="rol.codigo", primary_key=True)
    asignado_por_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
    expires_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True)
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )
    
    usuario: Optional["Usuario"] = Relationship(
        back_populates="roles",
        sa_relationship_kwargs={
            "foreign_keys": "[UsuarioRol.usuario_id]"
        }
    )

    asignado_por: Optional["Usuario"] = Relationship(
        back_populates="roles_asignados",
        sa_relationship_kwargs={
            "foreign_keys": "[UsuarioRol.asignado_por_id]"
        }
    )

    rol: Optional["Rol"] = Relationship(
        back_populates="usuarios_roles"
    )
