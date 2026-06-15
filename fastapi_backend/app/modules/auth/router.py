from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session, select
import os

from app.core.database import get_session
from app.core.security import get_current_user
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    LogoutResponse,
    MeResponse,
)
from app.modules.auth.service import AuthService
from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.usuario.service import UsuarioService, hash_password
from app.modules.usuario.schemas import UsuarioCreate, UsuarioPublic

IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"
IS_TEST = os.getenv("ENVIRONMENT") == "test"

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _maybe_limit(limit_value: str):
    if IS_TEST:
        return lambda f: f
    return limiter.limit(limit_value)


def _set_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        path="/",
        max_age=1800,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        path="/",
        max_age=604800,
    )


def _clear_auth_cookies(response: JSONResponse) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


@router.post(
    "/register",
    response_model=UsuarioPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
)
@_maybe_limit("5/1minute")
def register(
    data: RegisterRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    svc = UsuarioService(session)
    return svc.create(
        UsuarioCreate(
            nombre=data.nombre,
            apellido=data.apellido,
            email=data.email,
            password=data.password,
            celular=data.celular,
        )
    )


@router.post("/login", response_model=LoginResponse)
@_maybe_limit("5/1minute")
def login(
    data: LoginRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    service = AuthService(session)
    result = service.login(data)
    response = JSONResponse(content={
        "message": "Inicio de sesion exitoso",
        "access_token": result.access_token,
        "refresh_token": result.refresh_token,
        "token_type": "bearer"
    })
    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return response


@router.post("/refresh")
def refresh(request: Request, session: Session = Depends(get_session)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no encontrado",
        )
    service = AuthService(session)
    result = service.refresh(RefreshRequest(refresh_token=refresh_token))
    response = JSONResponse(content={"message": "Token renovado"})
    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return response


@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: Request,
    session: Session = Depends(get_session),
):

    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        service = AuthService(session)
        service.logout(refresh_token)
    response = JSONResponse(content=LogoutResponse().model_dump())
    _clear_auth_cookies(response)
    return response


@router.get("/me", response_model=MeResponse)
def get_me(
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(UsuarioRol).where(
        UsuarioRol.usuario_id == current_user.id
    )
    usuario_roles = session.exec(stmt).all()
    roles = [ur.rol_codigo for ur in usuario_roles] if usuario_roles else ["CLIENTE"]

    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        nombre=current_user.nombre,
        apellido=current_user.apellido,
        roles=roles,
    )
