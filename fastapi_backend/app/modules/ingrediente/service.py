
from fastapi import HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.modules.ingrediente.models import Ingrediente
from app.modules.producto.models import ProductoIngrediente, Producto
from app.modules.ingrediente.schemas import (
    IngredienteCreate, IngredientePublic, IngredienteUpdate, IngredienteList,
)
from app.modules.ingrediente.unit_of_work import IngredienteUnitOfWork


def _now() -> datetime:
    return datetime.now(timezone.utc)


class IngredienteService:
    def __init__(self, session: Session) -> None:
        self._session = session


    def _get_or_404(self, uow: IngredienteUnitOfWork, ingrediente_id: int) -> Ingrediente:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con id={ingrediente_id} no encontrado",
            )
        return ingrediente

    def _assert_nombre_unique(self, uow: IngredienteUnitOfWork, nombre: str) -> None:
        if uow.ingredientes.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El nombre '{nombre}' ya está en uso",
            )

    def _assert_relacion_not_exists(self, uow: IngredienteUnitOfWork, producto_id: int, ingrediente_id: int) -> None:
        if uow.producto_ingredientes.exists(producto_id, ingrediente_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El ingrediente id={ingrediente_id} ya está asignado al producto id={producto_id}",
            )

    def _get_relacion_or_404(self, uow: IngredienteUnitOfWork, producto_id: int, ingrediente_id: int) -> ProductoIngrediente:
        relacion = uow.producto_ingredientes.get_by_pk(producto_id, ingrediente_id)
        if not relacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relación entre producto id={producto_id} e ingrediente id={ingrediente_id} no encontrada",
            )
        return relacion


    def _assert_unidad_medida_exists(self, uow, unidad_medida_id: int) -> None:
        from app.modules.unidadMedida.models import UnidadMedida
        unidad = uow.ingredientes.session.get(UnidadMedida, unidad_medida_id)
        if not unidad:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unidad de medida con id={unidad_medida_id} no encontrada",
            )

    def create(self, data: IngredienteCreate) -> IngredientePublic:
        with IngredienteUnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)
            if data.unidad_medida_id is not None:
                self._assert_unidad_medida_exists(uow, data.unidad_medida_id)
            ingrediente = Ingrediente.model_validate(data)
            uow.ingredientes.add(ingrediente)
            result = IngredientePublic.model_validate(ingrediente)

        return result

    def get_all(self, offset: int = 0, limit: int = 20, nombre: str | None = None) -> IngredienteList:
        with IngredienteUnitOfWork(self._session) as uow:
            ingredientes = uow.ingredientes.get_all_paged(offset=offset, limit=limit, nombre=nombre)
            total = uow.ingredientes.count(nombre=nombre)

            result = IngredienteList(
                data=[IngredientePublic.model_validate(i) for i in ingredientes],
                total=total,
            )

        return result

    def get_by_id(self, ingrediente_id: int) -> IngredientePublic:
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)
            result = IngredientePublic.model_validate(ingrediente)

        return result

    def update(self, ingrediente_id: int, data: IngredienteUpdate) -> IngredientePublic:
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)

            if data.nombre and data.nombre != ingrediente.nombre:
                self._assert_nombre_unique(uow, data.nombre)

            patch = data.model_dump(exclude_unset=True)
            for field, value in patch.items():
                setattr(ingrediente, field, value)

            ingrediente.updated_at = _now()
            uow.ingredientes.add(ingrediente)
            result = IngredientePublic.model_validate(ingrediente)

        return result

    def soft_delete(self, ingrediente_id: int) -> None:
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)

            stmt = (
                select(ProductoIngrediente)
                .join(Producto)
                .where(
                    ProductoIngrediente.ingrediente_id == ingrediente_id,
                    Producto.disponible == True,
                    Producto.deleted_at == None,
                )
                .limit(1)
            )
            if self._session.exec(stmt).first() is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No se puede eliminar el ingrediente porque está asociado a productos activos",
                )

            ingrediente.activo = False
            ingrediente.deleted_at = _now()
            ingrediente.updated_at = _now()
            uow.ingredientes.add(ingrediente)
