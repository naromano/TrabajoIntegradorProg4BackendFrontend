import os
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from sqlmodel import Session, select

from app.core.database import get_session
from app.modules.usuario.models import Usuario, UsuarioRol

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET no está definida en el .env")
JWT_ALGORITHM = "HS256"


security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    token_data: Optional[HTTPBearer] = Depends(security_scheme),
    session: Session = Depends(get_session),
    request: Request = None,
) -> Usuario:
    token = None
    if token_data is not None:
        token = token_data.credentials


    if token is None and request is not None:
        token = request.cookies.get("access_token")

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = int(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = session.get(Usuario, user_id)
    if not usuario or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
        )

    return usuario


def require_roles(*roles: str):
    def role_checker(
        current_user: Usuario = Depends(get_current_user),
        session: Session = Depends(get_session),
    ) -> Usuario:
        stmt = select(UsuarioRol).where(
            UsuarioRol.usuario_id == current_user.id
        )
        usuario_roles = session.exec(stmt).all()
        user_role_codes = [ur.rol_codigo for ur in usuario_roles]


        if not user_role_codes:
            user_role_codes = ["CLIENTE"]

        if not any(r in user_role_codes for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de estos roles: {', '.join(roles)}",
            )
        return current_user

    return role_checker


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.JWTError:
        return None
