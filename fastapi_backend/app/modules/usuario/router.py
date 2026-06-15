from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_user, require_roles
from app.modules.usuario.models import Usuario
from app.modules.usuario.schemas import (
    UsuarioCreate,
    UsuarioPublic,
    UsuarioUpdate,
    UsuarioList,
    UsuarioRolCreate,
    UsuarioRolPublic,
    UsuarioRolList,
)
from app.modules.usuario.service import UsuarioService

router = APIRouter()


def get_usuario_service(session: Session = Depends(get_session),) -> UsuarioService:
    return UsuarioService(session)


OffsetQuery = Annotated[int,Query(ge=0, description="Registros a omitir")]
LimitQuery = Annotated[int,Query(ge=1, le=100, description="Máximo de resultados")]


@router.post(
    "/",
    response_model=UsuarioPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear usuario",
)
def create_usuario(
    data: UsuarioCreate,
    svc: UsuarioService = Depends(get_usuario_service),
) -> UsuarioPublic:
    return svc.create(data)


@router.get(
    "/",
    response_model=UsuarioList,
    summary="Listar usuarios",
)
def list_usuarios(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    search: Annotated[Optional[str], Query(description="Buscar por nombre, apellido o email")] = None,
    svc: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> UsuarioList:
    return svc.get_all(offset, limit, search=search)


@router.get(
    "/{usuario_id}",
    response_model=UsuarioPublic,
    summary="Obtener usuario por ID",
)
def get_usuario(
    usuario_id: Annotated[int,Path(gt=0, description="ID del usuario")],
    svc: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> UsuarioPublic:
    return svc.get_by_id(usuario_id)


@router.patch(
    "/{usuario_id}",
    response_model=UsuarioPublic,
    summary="Actualizar usuario",
)
def update_usuario(
    usuario_id: Annotated[int,Path(gt=0, description="ID del usuario")],
    data: UsuarioUpdate,
    svc: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> UsuarioPublic:
    return svc.update(usuario_id, data)


@router.delete(
    "/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar usuario",
)
def delete_usuario(
    usuario_id: Annotated[int,Path(gt=0, description="ID del usuario")],
    svc: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> None:
    svc.soft_delete(usuario_id)


@router.post(
    "/roles",
    response_model=UsuarioRolPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Asignar rol a usuario",
)
def create_rol(
    data: UsuarioRolCreate,
    svc: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> UsuarioRolPublic:
    return svc.create_rol(data)


@router.get(
    "/{usuario_id}/roles",
    response_model=UsuarioRolList,
    summary="Listar roles de usuario",
)
def get_roles(
    usuario_id: Annotated[
        int,
        Path(gt=0, description="ID usuario")
    ],
    svc: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> UsuarioRolList:
    return svc.get_roles(usuario_id)


@router.delete(
    "/{usuario_id}/roles/{rol_codigo}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Quitar rol de usuario",
)
def delete_rol(
    usuario_id: Annotated[int,Path(gt=0, description="ID usuario")],
    rol_codigo: Annotated[str,Path(description="Código del rol")],
    svc: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> None:
    svc.delete_rol(usuario_id, rol_codigo)