import os
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional
import jwt
from fastapi import HTTPException, status
from sqlmodel import Session
from passlib.context import CryptContext
from sqlmodel import select

from app.modules.auth.models import RefreshToken
from app.modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
)
from app.modules.auth.unit_of_work import RefreshTokenUnitOfWork
from app.modules.usuario.models import Usuario, UsuarioRol


JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET no esta definida en el .env")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _create_access_token(
    usuario: Usuario,
    session: Session
) -> str:
    stmt = (
        select(UsuarioRol)
        .where(
            UsuarioRol.usuario_id == usuario.id
        )
    )

    usuario_rol = session.exec(stmt).first()

    rol = (
        usuario_rol.rol_codigo
        if usuario_rol
        else "CLIENTE"
    )

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(usuario.id),
        "email": usuario.email,
        "rol": rol,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


def _create_refresh_token() -> str:
    return secrets.token_urlsafe(32)


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


class AuthService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_usuario_by_email(self, email: str) -> Optional[Usuario]:
        statement = select(Usuario).where(Usuario.email == email, Usuario.activo == True)
        return self._session.exec(statement).first()

    def login(self, data: LoginRequest) -> LoginResponse:
        with RefreshTokenUnitOfWork(self._session) as uow:

            usuario = self._get_usuario_by_email(data.email)
            if not usuario:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales invalidas",
                )

            if not _verify_password(data.password, usuario.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales invalidas",
                )

            access_token = _create_access_token(usuario, self._session)
            refresh_token = _create_refresh_token()
            refresh_token_hash = _hash_token(refresh_token)

            expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

            rt = RefreshToken(
                usuario_id=usuario.id,
                token_hash=refresh_token_hash,
                expires_at=expires_at,
            )
            uow.refresh_tokens.add(rt)

            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
            )

    def refresh(self, data: RefreshRequest) -> RefreshResponse:
        with RefreshTokenUnitOfWork(self._session) as uow:

            token_hash = _hash_token(data.refresh_token)

            rt = uow.refresh_tokens.get_valid_token(token_hash)
            if not rt:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token invalido o vencido",
                )

            usuario = rt.usuario
            if not usuario or not usuario.activo:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no encontrado o inactivo",
                )

            uow.refresh_tokens.revoke(rt)

            access_token = _create_access_token(usuario, self._session)
            new_refresh_token = _create_refresh_token()
            new_refresh_token_hash = _hash_token(new_refresh_token)

            expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            new_rt = RefreshToken(
                usuario_id=usuario.id,
                token_hash=new_refresh_token_hash,
                expires_at=expires_at,
            )
            uow.refresh_tokens.add(new_rt)

            return RefreshResponse(
                access_token=access_token,
                refresh_token=new_refresh_token,
            )

    def logout(self, refresh_token: str) -> None:
        with RefreshTokenUnitOfWork(self._session) as uow:
            token_hash = _hash_token(refresh_token)

            rt = uow.refresh_tokens.get_by_token_hash(token_hash)
            if rt and not rt.revoked_at:
                uow.refresh_tokens.revoke(rt)

    def logout_all(self, usuario_id: int) -> None:
        with RefreshTokenUnitOfWork(self._session) as uow:
            uow.refresh_tokens.revoke_all_by_usuario(usuario_id)
