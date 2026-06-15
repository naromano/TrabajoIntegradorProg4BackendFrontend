from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_roles
from app.modules.estadisticas.schemas import (
    IngresosFormaPagoResponse,
    PedidosEstadoResponse,
    ProductoTopResponse,
    ResumenResponse,
    VentasPeriodoResponse,
)
from app.modules.estadisticas.service import EstadisticasService
from app.modules.usuario.models import Usuario

router = APIRouter()


@router.get(
    "/resumen",
    response_model=ResumenResponse,
    summary="Resumen del dashboard de estadisticas",
)
def get_resumen(
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> ResumenResponse:
    service = EstadisticasService(session)
    return service.get_resumen()


@router.get(
    "/ventas",
    response_model=VentasPeriodoResponse,
    summary="Ventas agrupadas por periodo",
)
def get_ventas(
    desde: date = Query(..., description="Fecha de inicio (YYYY-MM-DD)"),
    hasta: date = Query(..., description="Fecha de fin (YYYY-MM-DD)"),
    agrupacion: str = Query(
        "day",
        description="Intervalo de agrupacion: day, week o month",
    ),
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> VentasPeriodoResponse:
    service = EstadisticasService(session)
    return service.get_ventas_periodo(desde, hasta, agrupacion)


@router.get(
    "/productos-top",
    response_model=ProductoTopResponse,
    summary="Productos con mayores ingresos",
)
def get_productos_top(
    limit: int = Query(10, ge=1, le=100, description="Cantidad maxima de resultados"),
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> ProductoTopResponse:
    service = EstadisticasService(session)
    return service.get_productos_top(limit)


@router.get(
    "/pedidos-por-estado",
    response_model=PedidosEstadoResponse,
    summary="Cantidad de pedidos por estado",
)
def get_pedidos_por_estado(
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> PedidosEstadoResponse:
    service = EstadisticasService(session)
    return service.get_pedidos_por_estado()


@router.get(
    "/ingresos",
    response_model=IngresosFormaPagoResponse,
    summary="Ingresos por forma de pago",
)
def get_ingresos(
    desde: date = Query(..., description="Fecha de inicio (YYYY-MM-DD)"),
    hasta: date = Query(..., description="Fecha de fin (YYYY-MM-DD)"),
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> IngresosFormaPagoResponse:
    service = EstadisticasService(session)
    return service.get_ingresos_por_forma_pago(desde, hasta)
