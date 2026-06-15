from datetime import date
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlmodel import Session, func, select

from app.modules.DetallePedido.models import DetallePedido
from app.modules.Pago.models import Pago
from app.modules.Pedido.models import Pedido
from app.modules.estadisticas.schemas import (
    IngresosFormaPagoItem,
    IngresosFormaPagoResponse,
    PedidosEstadoItem,
    PedidosEstadoResponse,
    ProductoTopItem,
    ProductoTopResponse,
    ResumenResponse,
    VentasPeriodoItem,
    VentasPeriodoResponse,
)

AGRUPACIONES_VALIDAS = {"day", "week", "month"}


class EstadisticasService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_resumen(self) -> ResumenResponse:
        hoy = date.today()

        ventas_hoy = float(
            self._session.exec(
                select(func.coalesce(func.sum(Pedido.total), 0)).where(
                    Pedido.estado_codigo != "CANCELADO",
                    Pedido.deleted_at.is_(None),
                    func.date(Pedido.created_at) == hoy,
                )
            ).one()
        )

        ticket_promedio = float(
            self._session.exec(
                select(func.coalesce(func.avg(Pedido.total), 0)).where(
                    Pedido.estado_codigo != "CANCELADO",
                    Pedido.deleted_at.is_(None),
                )
            ).one()
        )

        pedidos_activos = self._session.exec(
            select(func.count(Pedido.id)).where(
                Pedido.estado_codigo.in_(["PENDIENTE", "CONFIRMADO", "EN_PREP"]),
                Pedido.deleted_at.is_(None),
            )
        ).one()

        mes_actual = float(
            self._session.exec(
                select(func.coalesce(func.sum(Pedido.total), 0)).where(
                    Pedido.estado_codigo != "CANCELADO",
                    Pedido.deleted_at.is_(None),
                    func.extract("month", Pedido.created_at) == hoy.month,
                    func.extract("year", Pedido.created_at) == hoy.year,
                )
            ).one()
        )

        return ResumenResponse(
            ventas_hoy=ventas_hoy,
            ticket_promedio=ticket_promedio,
            pedidos_activos=pedidos_activos,
            mes_actual=mes_actual,
        )

    def get_ventas_periodo(
        self, desde: date, hasta: date, agrupacion: str
    ) -> VentasPeriodoResponse:
        if agrupacion not in AGRUPACIONES_VALIDAS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Agrupacion invalida: '{agrupacion}'. "
                    f"Debe ser una de: {', '.join(sorted(AGRUPACIONES_VALIDAS))}"
                ),
            )

        periodo_expr = func.date_trunc(
            text(f"'{agrupacion}'"), Pedido.created_at
        ).label("periodo")

        stmt = (
            select(
                periodo_expr,
                func.coalesce(func.sum(Pedido.total), 0).label("total_ventas"),
                func.count(Pedido.id).label("cantidad_pedidos"),
            )
            .where(
                Pedido.estado_codigo != "CANCELADO",
                Pedido.deleted_at.is_(None),
                func.date(Pedido.created_at) >= desde,
                func.date(Pedido.created_at) <= hasta,
            )
            .group_by(text("periodo"))
            .order_by(text("periodo"))
        )

        rows = self._session.exec(stmt).all()

        data = [
            VentasPeriodoItem(
                periodo=str(row.periodo),
                total_ventas=float(row.total_ventas),
                cantidad_pedidos=row.cantidad_pedidos,
            )
            for row in rows
        ]

        return VentasPeriodoResponse(data=data, total=len(data))

    def get_productos_top(self, limit: int = 10) -> ProductoTopResponse:
        stmt = (
            select(
                DetallePedido.producto_id,
                DetallePedido.nombre_snapshot.label("nombre"),
                func.sum(DetallePedido.subtotal_snap).label("ingresos"),
                func.count().label("cantidad_vendida"),
            )
            .join(Pedido, DetallePedido.pedido_id == Pedido.id)
            .where(
                Pedido.estado_codigo != "CANCELADO",
                Pedido.deleted_at.is_(None),
            )
            .group_by(DetallePedido.producto_id, DetallePedido.nombre_snapshot)
            .order_by(text("ingresos DESC"))
            .limit(limit)
        )

        rows = self._session.exec(stmt).all()

        data = [
            ProductoTopItem(
                producto_id=row.producto_id,
                nombre=row.nombre,
                ingresos=float(row.ingresos),
                cantidad_vendida=row.cantidad_vendida,
            )
            for row in rows
        ]

        return ProductoTopResponse(data=data, total=len(data))

    def get_pedidos_por_estado(self) -> PedidosEstadoResponse:
        stmt = (
            select(
                Pedido.estado_codigo,
                func.count(Pedido.id).label("cantidad"),
            )
            .where(Pedido.deleted_at.is_(None))
            .group_by(Pedido.estado_codigo)
            .order_by(Pedido.estado_codigo)
        )

        rows = self._session.exec(stmt).all()

        data = [
            PedidosEstadoItem(
                estado_codigo=row.estado_codigo,
                cantidad=row.cantidad,
            )
            for row in rows
        ]

        return PedidosEstadoResponse(data=data, total=len(data))

    def get_ingresos_por_forma_pago(
        self, desde: date, hasta: date
    ) -> IngresosFormaPagoResponse:
        stmt = (
            select(
                Pedido.forma_pago_codigo,
                func.coalesce(func.sum(Pago.transaction_amount), 0).label("total"),
                func.count(Pago.id).label("cantidad"),
            )
            .join(Pago, Pedido.id == Pago.pedido_id)
            .where(
                Pago.mp_status == "approved",
                Pedido.deleted_at.is_(None),
                func.date(Pago.created_at) >= desde,
                func.date(Pago.created_at) <= hasta,
            )
            .group_by(Pedido.forma_pago_codigo)
            .order_by(text("total DESC"))
        )

        rows = self._session.exec(stmt).all()

        data = [
            IngresosFormaPagoItem(
                forma_pago_codigo=row.forma_pago_codigo,
                total=float(row.total),
                cantidad=row.cantidad,
            )
            for row in rows
        ]

        return IngresosFormaPagoResponse(data=data, total=len(data))
