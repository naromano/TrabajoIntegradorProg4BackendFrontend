from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime

class UsuarioCreate(SQLModel):
    nombre: str = Field(max_length=80)
    apellido: str = Field(max_length=80)
    email: str = Field(max_length=254)
    celular: Optional[str] = Field(default=None, max_length=20)
    password: str = Field(min_length=6, max_length=255)


class UsuarioUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, max_length=80)
    apellido: Optional[str] = Field(default=None, max_length=80)
    email: Optional[str] = Field(default=None, max_length=254)
    celular: Optional[str] = Field(default=None, max_length=20)
    password: Optional[str] = Field(default=None, min_length=6, max_length=255)


class UsuarioPublic(SQLModel):
    id: int
    nombre: str
    apellido: str
    email: str
    celular: Optional[str]
    activo: bool
    rol: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class UsuarioList(SQLModel):
    data: List[UsuarioPublic]
    total: int



class UsuarioRolCreate(SQLModel):
    usuario_id: int = Field(gt=0)
    rol_codigo: str
    asignado_por_id: Optional[int] = None
    expires_at: Optional[datetime] = None


class UsuarioRolPublic(SQLModel):
    usuario_id: int
    rol_codigo: str
    asignado_por_id: Optional[int]
    expires_at: Optional[datetime]
    created_at: datetime


class UsuarioRolList(SQLModel):
    data: List[UsuarioRolPublic]
    total: int