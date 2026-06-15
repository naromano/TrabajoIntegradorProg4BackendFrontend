
from fastapi import HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.modules.categoria.models import Categoria
from app.modules.categoria.schemas import (
    CategoriaCreate, CategoriaPublic, CategoriaUpdate, CategoriaList,
    CategoriaTree,
)
from app.modules.categoria.unit_of_work import CategoriaUnitOfWork

def _now() -> datetime:
    return datetime.now(timezone.utc)


class CategoriaService:
    def __init__(self, session: Session) -> None:
        self._session = session


    def _get_or_404(self, uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if not categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria con id={categoria_id} no encontrada",
            )
        return categoria

    def _assert_nombre_unique(self, uow: CategoriaUnitOfWork, nombre: str) -> None:
        if uow.categorias.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El nombre '{nombre}' ya está en uso",
            )

    def _assert_parent_exists(self, uow: CategoriaUnitOfWork, parent_id: int) -> None:
        parent = uow.categorias.get_by_id(parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria padre con id={parent_id} no encontrada",
            )

    def create(self, data: CategoriaCreate) -> CategoriaPublic:
        with CategoriaUnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)

            if data.parent_id is not None:
                self._assert_parent_exists(uow, data.parent_id)

            categoria = Categoria.model_validate(data)
            uow.categorias.add(categoria)

            result = CategoriaPublic.model_validate(categoria)

        return result

    def get_all(self, offset: int = 0, limit: int = 20) -> CategoriaList:
        with CategoriaUnitOfWork(self._session) as uow:
            categorias = uow.categorias.get_active(offset=offset, limit=limit)
            total = uow.categorias.count()

            result = CategoriaList(
                data=[CategoriaPublic.model_validate(c) for c in categorias],
                total=total,
            )

        return result

    def get_by_id(self, categoria_id: int) -> CategoriaPublic:
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)
            result = CategoriaPublic.model_validate(categoria)

        return result

    def get_by_parent(self, parent_id: int, offset: int = 0, limit: int = 20) -> CategoriaList:
        with CategoriaUnitOfWork(self._session) as uow:
            self._assert_parent_exists(uow, parent_id)
            categorias = uow.categorias.get_by_parent(parent_id, offset=offset, limit=limit)

            result = CategoriaList(
                data=[CategoriaPublic.model_validate(c) for c in categorias],
                total=len(categorias),
            )

        return result

    def update(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaPublic:
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)

            if data.nombre and data.nombre != categoria.nombre:
                self._assert_nombre_unique(uow, data.nombre)

            if data.parent_id and data.parent_id != categoria.parent_id:
                self._assert_parent_exists(uow, data.parent_id)

            patch = data.model_dump(exclude_unset=True)
            for field, value in patch.items():
                setattr(categoria, field, value)

            categoria.updated_at = _now()
            uow.categorias.add(categoria)
            result = CategoriaPublic.model_validate(categoria)

        return result

    def _get_descendant_ids(self, categoria_id: int) -> list[int]:
        """Recolecta recursivamente todos los IDs de subcategorías activas."""
        from app.modules.categoria.models import Categoria
        ids = [categoria_id]
        children = self._session.exec(
            select(Categoria)
            .where(Categoria.parent_id == categoria_id, Categoria.activo == True)
        ).all()
        for child in children:
            ids.extend(self._get_descendant_ids(child.id))
        return ids

    def soft_delete(self, categoria_id: int) -> None:
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)


            from app.modules.producto.models import Producto, ProductoCategoria
            category_ids = self._get_descendant_ids(categoria_id)
            stmt = (
                select(ProductoCategoria)
                .join(Producto, ProductoCategoria.producto_id == Producto.id)
                .where(ProductoCategoria.categoria_id.in_(category_ids))
                .where(Producto.disponible == True)
                .where(Producto.deleted_at == None)
                .limit(1)
            )
            has_active = self._session.exec(stmt).first() is not None
            if has_active:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No se puede eliminar la categoría porque tiene productos activos asociados",
                )

            categoria.activo = False
            categoria.deleted_at = _now()
            categoria.updated_at = _now()
            uow.categorias.add(categoria)

    def get_tree(self) -> list[CategoriaTree]:
        with CategoriaUnitOfWork(self._session) as uow:
            return self._build_tree(uow, parent_id=None)

    def _build_tree(self, uow: CategoriaUnitOfWork, parent_id: int | None) -> list[CategoriaTree]:
        categorias = uow.categorias.session.exec(
            select(Categoria)
            .where(Categoria.parent_id == parent_id)
            .where(Categoria.activo == True)
            .order_by(Categoria.nombre)
        ).all()

        result = []
        for cat in categorias:
            children = self._build_tree(uow, cat.id)
            result.append(CategoriaTree(
                id=cat.id,
                parent_id=cat.parent_id,
                nombre=cat.nombre,
                descripcion=cat.descripcion,
                children=children,
            ))
        return result
