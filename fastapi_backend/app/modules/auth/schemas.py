from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class RegisterRequest(SQLModel):
    nombre: str = Field(min_length=2, max_length=80)
    apellido: str = Field(min_length=2, max_length=80)
    email: str = Field(max_length=254)
    password: str = Field(min_length=8)
    celular: Optional[str] = Field(default=None, max_length=20)


class LoginRequest(SQLModel):
    email: str = Field(max_length=254)
    password: str = Field(min_length=6)


class LoginResponse(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(SQLModel):
    refresh_token: str


class RefreshResponse(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutResponse(SQLModel):
    message: str = "Token invalidado correctamente"


class MeResponse(SQLModel):
    id: int
    email: str
    nombre: str
    apellido: str
    roles: list[str]
