from fastapi import HTTPException, status
from sqlmodel import Session
from datetime import datetime, timezone

from app.modules.Pedido.models import Pedido
from app.modules.DetallePedido.models import DetallePedido
from app.modules.HistorialEstadoPedido.models import HistorialEstadoPedido
from app.modules.Pedido.schemas import (
    PedidoCreate,
    PedidoAvanzarEstado,
    PedidoPublic,
    PedidoPublicSimple,
    PedidoList,
    DetallePedidoPublic,
    HistorialEstadoPublic,
    PedidoEstadoPedido,
    PedidoItemEstado,
    PedidoEstadoList,
    ValidarStockRequest,
    ValidarStockResponse,
)
from app.modules.Pedido.unit_of_work import PedidoUnitOfWork
from app.modules.producto.models import Producto
from app.modules.ingrediente.models import Ingrediente
from app.modules.unidadMedida.models import UnidadMedida
from app.modules.EstadoPedido.models import EstadoPedido


EVENTOS_WS = {
    "PENDIENTE":  "estado_cambiado",
    "CONFIRMADO": "estado_cambiado",
    "EN_PREP":    "estado_cambiado",
    "ENTREGADO":  "estado_cambiado",
    "CANCELADO":  "pedido_cancelado",
}

ROLES_POR_TRANSICION = {
    "PENDIENTE":  ["ADMIN", "PEDIDOS", "CLIENTE"],
    "CONFIRMADO": ["ADMIN", "PEDIDOS", "STOCK", "CLIENTE"],
    "EN_PREP":    ["ADMIN", "PEDIDOS", "STOCK", "CLIENTE"],
    "ENTREGADO":  ["ADMIN", "PEDIDOS", "CLIENTE"],
    "CANCELADO":  ["ADMIN", "PEDIDOS", "STOCK", "CLIENTE"],
}



_UNIT_CONVERSION: dict[tuple[str, str], float] = {
    ("masa", "g"): 1.0,
    ("masa", "kg"): 1000.0,
    ("volumen", "mL"): 1.0,
    ("volumen", "L"): 1000.0,
    ("unidad", "u"): 1.0,
    ("unidad", "doc"): 12.0,
}


def _convertir_unidad(
    cantidad: float,
    tipo: str,
    simbolo_origen: str,
    simbolo_destino: str,
) -> float:
    """Convierte *cantidad* de *simbolo_origen* a *simbolo_destino* (mismo tipo)."""
    if simbolo_origen == simbolo_destino:
        return cantidad
    f_origen = _UNIT_CONVERSION.get((tipo, simbolo_origen))
    f_destino = _UNIT_CONVERSION.get((tipo, simbolo_destino))
    if f_origen is None or f_destino is None:
        return cantidad  
    return cantidad * f_origen / f_destino


def _now() -> datetime:
    return datetime.now(timezone.utc)



FSM: dict[str, list[str]] = {
    "PENDIENTE":   ["CONFIRMADO", "CANCELADO"],
    "CONFIRMADO":  ["EN_PREP", "CANCELADO"],
    "EN_PREP":     ["ENTREGADO", "CANCELADO"],
    "ENTREGADO":   [],
    "CANCELADO":   [],
}


class PedidoService:
    def __init__(self, session: Session) -> None:
        self._session = session


    def _get_or_404(self, uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_active_by_id(pedido_id)
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido con id={pedido_id} no encontrado",
            )
        return pedido

    def _get_producto_or_404(self, session: Session, producto_id: int) -> Producto:
        producto = session.get(Producto, producto_id)
        if not producto or producto.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id={producto_id} no encontrado",
            )
        return producto

    def _assert_disponible(self, producto: Producto) -> None:
        if not producto.disponible:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Producto '{producto.nombre}' no está disponible",
            )

    def _assert_transicion_valida(
        self, estado_actual: str, estado_hacia: str
    ) -> None:
        permitidos = FSM.get(estado_actual, [])
        if estado_hacia not in permitidos:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Transición inválida: {estado_actual} → {estado_hacia}. "
                       f"Permitidas: {permitidos}",
            )

    def _assert_motivo_si_cancelado(
        self, estado_hacia: str, motivo: str | None
    ) -> None:
    
        if estado_hacia == "CANCELADO" and not motivo:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="El campo 'motivo' es obligatorio al cancelar un pedido",
            )

    def _to_public(self, pedido: Pedido) -> PedidoPublic:
        return PedidoPublic(
            **pedido.model_dump(),
            detalles=[DetallePedidoPublic.model_validate(d) for d in pedido.detalles],
            historial=[HistorialEstadoPublic.model_validate(h) for h in pedido.historial],
            usuario_nombre=f"{pedido.usuario.nombre} {pedido.usuario.apellido}" if pedido.usuario else None,
            direccion_texto=f"{pedido.direccion.alias}: {pedido.direccion.linea1}, {pedido.direccion.ciudad}" if pedido.direccion else None,
        )

    def validar_stock(self, data: ValidarStockRequest) -> ValidarStockResponse:
        """Valida stock de los items sin crear pedido."""
        try:
            for item in data.items:
                producto = self._session.get(Producto, item.producto_id)
                if not producto or producto.deleted_at is not None:
                    return ValidarStockResponse(ok=False, detail=f"Producto con id={item.producto_id} no encontrado")
                if not producto.disponible:
                    return ValidarStockResponse(ok=False, detail=f"Producto '{producto.nombre}' no está disponible")

                if producto.producto_ingredientes:
                    for pi in producto.producto_ingredientes:
                        ingrediente = pi.ingrediente
                        stock_unidad = ingrediente.unidad_medida
                        receta_unidad = pi.unidad_medida
                        if stock_unidad and receta_unidad and stock_unidad.tipo == receta_unidad.tipo:
                            cantidad_por_item = _convertir_unidad(pi.cantidad, receta_unidad.tipo, receta_unidad.simbolo, stock_unidad.simbolo)
                        else:
                            cantidad_por_item = pi.cantidad
                        cantidad_necesaria = cantidad_por_item * item.cantidad
                        if ingrediente.stock_cantidad < cantidad_necesaria:
                            return ValidarStockResponse(ok=False, detail=f"El producto '{producto.nombre}' no tiene stock suficiente")
                else:
                    if producto.stock_cantidad < item.cantidad:
                        return ValidarStockResponse(ok=False, detail=f"El producto '{producto.nombre}' no tiene stock suficiente")
            return ValidarStockResponse(ok=True)
        except Exception:
            return ValidarStockResponse(ok=False, detail="Error al validar stock")

    async def create(self, data: PedidoCreate) -> PedidoPublic:
        with PedidoUnitOfWork(self._session) as uow:
            subtotal = 0.0
            detalles: list[DetallePedido] = []
            for item in data.items:
                producto = self._get_producto_or_404(self._session, item.producto_id)
                self._assert_disponible(producto)

                precio = float(producto.precio_base)
                sub = round(precio * item.cantidad, 2)
                subtotal += sub

                detalles.append(DetallePedido(
                    producto_id=item.producto_id,
                    cantidad=item.cantidad,
                    nombre_snapshot=producto.nombre,
                    precio_snapshot=precio,
                    subtotal_snap=sub,
                    personalizacion=item.personalizacion,
                ))

                if producto.producto_ingredientes:
                    for pi in producto.producto_ingredientes:
                        ingrediente = pi.ingrediente
                        stock_unidad = ingrediente.unidad_medida
                        receta_unidad = pi.unidad_medida

                        if stock_unidad and receta_unidad and stock_unidad.tipo == receta_unidad.tipo:
                            cantidad_por_item = _convertir_unidad(
                                pi.cantidad,
                                receta_unidad.tipo,
                                receta_unidad.simbolo,
                                stock_unidad.simbolo,
                            )
                        else:
                            cantidad_por_item = pi.cantidad

                        cantidad_necesaria = cantidad_por_item * item.cantidad
                        if ingrediente.stock_cantidad < cantidad_necesaria:
                            raise HTTPException(
                                status_code=status.HTTP_409_CONFLICT,
                                detail=f"El producto '{producto.nombre}' no tiene stock suficiente",
                            )
                else:
                    if producto.stock_cantidad < item.cantidad:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"El producto '{producto.nombre}' no tiene stock suficiente",
                        )

            descuento = 0.00
            costo_envio = 0.00 if (data.direccion_id is None or subtotal >= 10000) else 3500.00
            total = round(subtotal - descuento + costo_envio, 2)

            pedido = Pedido(
                usuario_id=data.usuario_id,
                direccion_id=data.direccion_id,
                estado_codigo="PENDIENTE",
                forma_pago_codigo=data.forma_pago_codigo,
                subtotal=subtotal,
                descuento=descuento,
                costo_envio=costo_envio,
                total=total,
                notas=data.notas,
            )
            uow.pedidos.add(pedido)

            for detalle in detalles:
                detalle.pedido_id = pedido.id
                uow.detalles.add(detalle)

            
            historial = HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde_codigo=None,
                estado_hacia_codigo="PENDIENTE",
                usuario_id=data.usuario_id,
            )
            uow.historial.add(historial)

            uow._session.refresh(pedido)
            result = self._to_public(pedido)

        await self._emit_ws_events(result.id, None, "PENDIENTE", data.usuario_id)

        return result

    def get_all(self, offset: int = 0, limit: int = 20, usuario_id: int | None = None, estado: str | None = None, pedido_id: int | None = None, nombre_cliente: str | None = None) -> PedidoList:
        with PedidoUnitOfWork(self._session) as uow:
            pedidos = uow.pedidos.get_all(offset=offset, limit=limit, usuario_id=usuario_id, estado=estado, pedido_id=pedido_id, nombre_cliente=nombre_cliente)
            total = uow.pedidos.count(usuario_id=usuario_id, estado=estado, pedido_id=pedido_id, nombre_cliente=nombre_cliente)
            result = PedidoList(
                data=[
                    PedidoPublicSimple(
                        **p.model_dump(),
                        usuario_nombre=f"{p.usuario.nombre} {p.usuario.apellido}" if p.usuario else None,
                    )
                    for p in pedidos
                ],
                total=total,
            )
        return result

    def get_by_usuario(
        self, usuario_id: int, offset: int = 0, limit: int = 20
    ) -> PedidoList:
        with PedidoUnitOfWork(self._session) as uow:
            pedidos = uow.pedidos.get_by_usuario(usuario_id, offset=offset, limit=limit)
            total = uow.pedidos.count_by_usuario(usuario_id)
            result = PedidoList(
                data=[
                    PedidoPublicSimple(
                        **p.model_dump(),
                        usuario_nombre=f"{p.usuario.nombre} {p.usuario.apellido}" if p.usuario else None,
                    )
                    for p in pedidos
                ],
                total=total,
            )
        return result

    def get_by_id(self, pedido_id: int) -> PedidoPublic:
        with PedidoUnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)
            result = self._to_public(pedido)
        return result

    async def avanzar_estado(
        self, pedido_id: int, data: PedidoAvanzarEstado
    ) -> PedidoPublic:
        with PedidoUnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)

            self._assert_transicion_valida(pedido.estado_codigo, data.estado_hacia_codigo)
            self._assert_motivo_si_cancelado(data.estado_hacia_codigo, data.motivo)

            estado_anterior = pedido.estado_codigo

            
            pedido.estado_codigo = data.estado_hacia_codigo
            pedido.updated_at = _now()
            uow.pedidos.add(pedido)

            
            historial = HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde_codigo=estado_anterior,
                estado_hacia_codigo=data.estado_hacia_codigo,
                usuario_id=data.usuario_id,
                motivo=data.motivo,
            )
            uow.historial.add(historial)

            if data.estado_hacia_codigo == "CONFIRMADO":
                for detalle in pedido.detalles:
                    producto = self._session.get(Producto, detalle.producto_id)
                    if not producto:
                        continue

                    if producto.producto_ingredientes:
                        for pi in producto.producto_ingredientes:
                            ingrediente = pi.ingrediente
                            stock_unidad = ingrediente.unidad_medida
                            receta_unidad = pi.unidad_medida

                            if stock_unidad and receta_unidad and stock_unidad.tipo == receta_unidad.tipo:
                                cantidad_por_item = _convertir_unidad(
                                    pi.cantidad,
                                    receta_unidad.tipo,
                                    receta_unidad.simbolo,
                                    stock_unidad.simbolo,
                                )
                            else:
                                cantidad_por_item = pi.cantidad

                            cantidad_necesaria = cantidad_por_item * detalle.cantidad
                            if ingrediente.stock_cantidad < cantidad_necesaria:
                                simb = stock_unidad.simbolo if stock_unidad else ""
                                raise HTTPException(
                                    status_code=status.HTTP_409_CONFLICT,
                                    detail=f"Stock insuficiente del ingrediente '{ingrediente.nombre}' "
                                        f"(disponible: {ingrediente.stock_cantidad} {simb}, "
                                               f"necesario: {cantidad_necesaria:.2f} {simb})",
                                )
                            ingrediente.stock_cantidad -= cantidad_necesaria
                            self._session.add(ingrediente)
                    else:
                            if producto.stock_cantidad < detalle.cantidad:
                                raise HTTPException(
                                    status_code=status.HTTP_409_CONFLICT,
                                    detail=f"Stock insuficiente del producto '{producto.nombre}' "
                                           f"(disponible: {producto.stock_cantidad}, solicitado: {detalle.cantidad})",
                                )
                            producto.stock_cantidad -= detalle.cantidad
                            self._session.add(producto)
           
            if data.estado_hacia_codigo == "CANCELADO" and estado_anterior == "CONFIRMADO":
                for detalle in pedido.detalles:
                    producto = self._session.get(Producto, detalle.producto_id)
                    if producto:
                        if producto.producto_ingredientes:
                            for pi in producto.producto_ingredientes:
                                ingrediente = pi.ingrediente
                                stock_unidad = ingrediente.unidad_medida
                                receta_unidad = pi.unidad_medida

                                if stock_unidad and receta_unidad and stock_unidad.tipo == receta_unidad.tipo:
                                    cantidad_por_item = _convertir_unidad(
                                        pi.cantidad,
                                        receta_unidad.tipo,
                                        receta_unidad.simbolo,
                                        stock_unidad.simbolo,
                                    )
                                else:
                                    cantidad_por_item = pi.cantidad

                                ingrediente.stock_cantidad += cantidad_por_item * detalle.cantidad
                                self._session.add(ingrediente)
                        else:
                            producto.stock_cantidad += detalle.cantidad
                            self._session.add(producto)

            if data.estado_hacia_codigo == "CANCELADO" and estado_anterior == "EN_PREP":
                for detalle in pedido.detalles:
                    producto = self._session.get(Producto, detalle.producto_id)
                    if producto and not producto.producto_ingredientes:
                        producto.stock_cantidad += detalle.cantidad
                        self._session.add(producto)

            uow._session.refresh(pedido)
            result = self._to_public(pedido)

        await self._emit_ws_events(result.id, estado_anterior, data.estado_hacia_codigo, data.usuario_id, data.motivo)

        return result

    async def _emit_ws_events(
        self,
        pedido_id: int,
        estado_anterior: str | None,
        estado_nuevo: str,
        usuario_id: int | None,
        motivo: str | None = None,
    ) -> None:
        import logging
        logger = logging.getLogger("app.modules.Pedido.service")
        from app.core.websocket import manager
        from datetime import datetime, timezone as tz

        event_type = EVENTOS_WS.get(estado_nuevo)
        if not event_type:
            logger.info(f"[WS] Estado {estado_nuevo} no tiene evento, no se emite")
            return

        payload = {
            "pedido_id": pedido_id,
            "estado_anterior": estado_anterior,
            "estado_nuevo": estado_nuevo,
            "usuario_id": usuario_id,
            "motivo": motivo,
            "timestamp": datetime.now(tz.utc).isoformat(),
        }

        logger.info(f"[WS] Emitiendo {event_type} para pedido {pedido_id} a roles {ROLES_POR_TRANSICION.get(estado_nuevo, [])}")
        logger.info(f"[WS] Rooms activas: {manager.get_rooms_info()}")
        await manager.broadcast_to_order(pedido_id, event_type, payload)
        roles = ROLES_POR_TRANSICION.get(estado_nuevo, [])
        if roles:
            await manager.broadcast_to_roles(roles, event_type, payload)

    async def cancelar(self, pedido_id: int, usuario_id: int, motivo: str) -> PedidoPublic:
        """Cancelar un pedido (CLIENTE dueño del pedido)."""
        with PedidoUnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)

            if pedido.usuario_id != usuario_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No puedes cancelar un pedido que no te pertenece",
                )

            data = PedidoAvanzarEstado(
                estado_hacia_codigo="CANCELADO",
                motivo=motivo,
                usuario_id=usuario_id,
            )

            return await self.avanzar_estado(pedido_id, data)

    def soft_delete(self, pedido_id: int) -> None:
        with PedidoUnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)
            pedido.deleted_at = _now()
            pedido.updated_at = _now()
            uow.pedidos.add(pedido)

    def get_estado_pedidos(self, usuario_id: int, offset: int = 0, limit: int = 12) -> PedidoEstadoList:
        """Obtiene pedidos simplificados para la vista de estado en frontend-store."""
        with PedidoUnitOfWork(self._session) as uow:
            pedidos = uow.pedidos.get_active_by_usuario(usuario_id, offset=offset, limit=limit)
            total = uow.pedidos.count_by_usuario(usuario_id)
            result = []
            for p in pedidos:
                items = [
                    PedidoItemEstado(
                        producto_id=d.producto_id,
                        nombre=d.nombre_snapshot,
                        cantidad=d.cantidad,
                        precio_unitario=d.precio_snapshot,
                        subtotal=d.subtotal_snap,
                    )
                    for d in p.detalles
                ]
                motivo = None
                if p.estado_codigo == "CANCELADO":
                    historial = uow.historial.get_by_pedido(p.id)
                    cancel_entry = next(
                        (h for h in historial if h.estado_hacia_codigo == "CANCELADO" and h.motivo),
                        None,
                    )
                    if cancel_entry:
                        motivo = cancel_entry.motivo
                result.append(PedidoEstadoPedido(
                    id=p.id,
                    fecha=p.created_at.isoformat(),
                    total=p.total,
                    estado=p.estado_codigo,
                    usuario_id=p.usuario_id,
                    items=items,
                    motivo_cancelacion=motivo,
                ))
            return PedidoEstadoList(data=result, total=total)