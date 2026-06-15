from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime
from datetime import datetime

if TYPE_CHECKING:
    from app.modules.usuario.models import UsuarioRol

class Rol(SQLModel, table=True):
    __tablename__ = "rol"

    codigo: str = Field(default=None, primary_key=True, max_length=50)
    nombre: str = Field(unique=True, max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=255)

    usuarios_roles: List["UsuarioRol"] = Relationship(back_populates="rol")