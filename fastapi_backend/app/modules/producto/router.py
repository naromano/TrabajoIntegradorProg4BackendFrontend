
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_roles
from app.modules.usuario.models import Usuario
from app.modules.producto.schemas import (
    ProductoCreate, ProductoPublic, ProductoUpdate, ProductoList,
    ProductoCategoriaList,
    ProductoIngredienteList,
    ProductoIngredienteCreate,
    DisponibilidadUpdate,
    CostoProductoResponse,
)
from app.modules.producto.service import ProductoService

router = APIRouter()


def get_producto_service(session: Session = Depends(get_session)) -> ProductoService:
    return ProductoService(session)


OffsetQuery = Annotated[int, Query(ge=0, description="Registros a omitir")]
LimitQuery  = Annotated[int, Query(ge=1, le=100, description="Máximo de resultados")]


@router.post(
    "/",
    response_model=ProductoPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un producto",
)
def create_producto(
    data: ProductoCreate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN", "STOCK")),
) -> ProductoPublic:
    return svc.create(data)


@router.get(
    "/",
    response_model=ProductoList,
    summary="Listar productos (paginado)",
)
def list_productos(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    nombre: Annotated[Optional[str], Query(description="Filtrar por nombre (búsqueda parcial)")] = None,
    categoria_id: Annotated[Optional[int], Query(description="Filtrar por categoría")] = None,
    sin_ingredientes: Annotated[Optional[bool], Query(description="Solo productos sin ingredientes")] = False,
    incluir_desactivados: Annotated[bool, Query(description="Incluir productos desactivados")] = False,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoList:
    return svc.get_all(offset=offset, limit=limit, nombre=nombre, incluir_desactivados=incluir_desactivados, categoria_id=categoria_id, sin_ingredientes=sin_ingredientes)


@router.get(
    "/categorias",
    response_model=ProductoCategoriaList,
    summary="Listar todas las relaciones producto-categoría",
)
def list_relaciones_categoria(
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoCategoriaList:
    return svc.get_all_relaciones()


@router.delete(
    "/categorias/{producto_id}/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar relación producto ↔ categoría",
)
def delete_relacion_categoria(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    categoria_id: Annotated[int, Path(gt=0, description="ID de la categoría")],
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> None:
    svc.delete_relacion(producto_id, categoria_id)


@router.get(
    "/ingredientes",
    response_model=ProductoIngredienteList,
    summary="Listar todas las relaciones producto-ingrediente",
)
def list_relaciones_ingrediente(
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoIngredienteList:
    return svc.get_all_relaciones_ingrediente()


@router.delete(
    "/ingredientes/{producto_id}/{ingrediente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar relación producto ↔ ingrediente",
)
def delete_relacion_ingrediente(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    ingrediente_id: Annotated[int, Path(gt=0, description="ID del ingrediente")],
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> None:
    svc.delete_relacion_ingrediente(producto_id, ingrediente_id)


@router.get(
    "/categoria/{categoria_id}",
    response_model=ProductoList,
    summary="Listar productos de una categoría",
)
def list_por_categoria(
    categoria_id: Annotated[int, Path(gt=0, description="ID de la categoría")],
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoList:
    return svc.get_by_categoria(categoria_id, offset=offset, limit=limit)


@router.get(
    "/{producto_id}/costo",
    response_model=CostoProductoResponse,
    summary="Calcular costo de ingredientes y precio sugerido",
)
def calcular_costo(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN", "STOCK")),
) -> CostoProductoResponse:
    return svc.calcular_costo(producto_id)


@router.get(
    "/{producto_id}",
    response_model=ProductoPublic,
    summary="Obtener producto por ID",
)
def get_producto(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoPublic:
    return svc.get_by_id(producto_id)


@router.patch(
    "/{producto_id}",
    response_model=ProductoPublic,
    summary="Actualizacion parcial de producto",
)
def update_producto(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    data: ProductoUpdate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN", "STOCK")),
) -> ProductoPublic:
    return svc.update(producto_id, data)


@router.put(
    "/{producto_id}",
    response_model=ProductoPublic,
    summary="Actualizacion completa de producto",
)
def update_producto_full(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    data: ProductoCreate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> ProductoPublic:
    patch = data.model_dump(exclude={"categoria_id", "es_principal", "ingredientes"})
    update_data = ProductoUpdate(**patch, categoria_id=data.categoria_id, es_principal=data.es_principal, ingredientes=data.ingredientes)
    return svc.update(producto_id, update_data)


@router.patch(
    "/{producto_id}/imagenes",
    response_model=ProductoPublic,
    summary="Actualizar lista de imagenes del producto",
)
def update_producto_imagenes(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    imagenes_url: list[str],
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> ProductoPublic:
    return svc.update(producto_id, ProductoUpdate(imagenes_url=imagenes_url))


@router.post(
    "/{producto_id}/ingredientes",
    response_model=ProductoPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Asociar ingrediente a un producto",
)
def asociar_ingrediente(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    data: ProductoIngredienteCreate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> ProductoPublic:
    from app.modules.producto.models import ProductoIngrediente
    from app.modules.ingrediente.models import Ingrediente
    from app.modules.producto.unit_of_work import ProductoUnitOfWork
    from app.modules.producto.schemas import ProductoIngredienteCreateInline

    with ProductoUnitOfWork(svc._session) as uow:
        producto = svc._get_or_404(uow, producto_id)
        ingrediente = uow.productos.session.get(Ingrediente, data.ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=404,
                detail=f"Ingrediente con id={data.ingrediente_id} no encontrado",
            )
        um_id = data.unidad_medida_id or ingrediente.unidad_medida_id
        relacion = ProductoIngrediente(
            producto_id=producto_id,
            ingrediente_id=data.ingrediente_id,
            es_removible=data.es_removible,
            cantidad=data.cantidad,
            unidad_medida_id=um_id,
        )
        uow.producto_ingredientes.add(relacion)
        uow.productos.session.refresh(producto)

    return svc.get_by_id(producto_id)


@router.patch(
    "/{producto_id}/disponibilidad",
    response_model=ProductoPublic,
    summary="Cambiar disponibilidad de un producto",
)
def cambiar_disponibilidad(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    data: DisponibilidadUpdate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN", "STOCK")),
) -> ProductoPublic:

    from app.modules.producto.schemas import ProductoUpdate
    return svc.update(producto_id, ProductoUpdate(disponible=data.disponible))


@router.delete(
    "/{producto_id}/desactivar",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de producto",
)
def soft_delete_producto(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> None:
    svc.soft_delete(producto_id)


@router.patch(
    "/{producto_id}/reactivar",
    response_model=ProductoPublic,
    summary="Reactivar producto desactivado",
)
def reactivate_producto(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> ProductoPublic:
    return svc.reactivate(producto_id)


