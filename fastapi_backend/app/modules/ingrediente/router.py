
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_user, require_roles
from app.modules.usuario.models import Usuario
from app.modules.ingrediente.schemas import (
    IngredienteCreate, IngredientePublic, IngredienteUpdate, IngredienteList,
)
from app.modules.ingrediente.service import IngredienteService

router = APIRouter()


def get_ingrediente_service(session: Session = Depends(get_session)) -> IngredienteService:
    return IngredienteService(session)


OffsetQuery = Annotated[int, Query(ge=0, description="Registros a omitir")]
LimitQuery  = Annotated[int, Query(ge=1, le=100, description="Máximo de resultados")]


@router.post(
    "/",
    response_model=IngredientePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un ingrediente",
)
def create_ingrediente(
    data: IngredienteCreate,
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> IngredientePublic:
    return svc.create(data)

@router.get(
    "/",
    response_model=IngredienteList,
    summary="Listar ingredientes (paginado)",
)
def list_ingredientes(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    nombre: Annotated[Optional[str], Query(description="Filtrar por nombre (búsqueda parcial)")] = None,
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(get_current_user),
) -> IngredienteList:
    return svc.get_all(offset=offset, limit=limit, nombre=nombre)

@router.get(
    "/{ingrediente_id}",
    response_model=IngredientePublic,
    summary="Obtener ingrediente por ID",
)
def get_ingrediente(
    ingrediente_id: Annotated[int, Path(gt=0, description="ID del ingrediente")],
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(get_current_user),
) -> IngredientePublic:
    return svc.get_by_id(ingrediente_id)

@router.patch(
    "/{ingrediente_id}",
    response_model=IngredientePublic,
    summary="Actualización parcial de ingrediente",
)
def update_ingrediente(
    ingrediente_id: Annotated[int, Path(gt=0, description="ID del ingrediente")],
    data: IngredienteUpdate,
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_roles("ADMIN", "STOCK")),
) -> IngredientePublic:
    return svc.update(ingrediente_id, data)

@router.delete(
    "/{ingrediente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar ingrediente",
)
def delete_ingrediente(
    ingrediente_id: Annotated[int, Path(gt=0, description="ID del ingrediente")],
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> None:
    svc.soft_delete(ingrediente_id)
