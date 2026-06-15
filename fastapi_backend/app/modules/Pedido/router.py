from typing import Annotated, Optional
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select

from app.core.database import get_session, engine
from app.core.security import get_current_user, require_roles, decode_access_token
from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.Pedido.schemas import (
    PedidoCreate,
    PedidoPublic,
    PedidoAvanzarEstado,
    PedidoList,
    CancelarPedidoRequest,
    PedidoEstadoPedido,
    PedidoEstadoList,
    ValidarStockRequest,
    ValidarStockResponse,
)
from app.modules.Pedido.service import PedidoService

router = APIRouter()


def get_pedido_service(session: Session = Depends(get_session),) -> PedidoService:
    return PedidoService(session)


OffsetQuery = Annotated[int, Query(ge=0, description="Registros a omitir")]
LimitQuery = Annotated[int, Query(ge=1, le=100, description="Máximo de resultados")]


@router.post(
    "/validar-stock",
    response_model=ValidarStockResponse,
    summary="Validar stock sin crear pedido",
)
def validar_stock(
    data: ValidarStockRequest,
    svc: PedidoService = Depends(get_pedido_service),
    _: Usuario = Depends(get_current_user),
) -> ValidarStockResponse:
    return svc.validar_stock(data)


@router.post(
    "/",
    response_model=PedidoPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear pedido",
)
async def create_pedido(
    data: PedidoCreate,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(get_current_user),
) -> PedidoPublic:
    if data.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear pedidos para otro usuario",
        )
    return await svc.create(data)


@router.get(
    "/",
    response_model=PedidoList,
    summary="Listar pedidos (con filtro por rol)",
)
def list_pedidos(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    usuario_filter: Annotated[Optional[int], Query(alias="usuario_id", ge=1, description="Filtrar por usuario (solo ADMIN/PEDIDOS)")] = None,
    estado: Annotated[Optional[str], Query(description="Filtrar por estado")] = None,
    pedido_id: Annotated[Optional[int], Query(description="Filtrar por número de pedido")] = None,
    nombre_cliente: Annotated[Optional[str], Query(description="Filtrar por nombre del cliente")] = None,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PedidoList:

    stmt = select(UsuarioRol).where(UsuarioRol.usuario_id == current_user.id)
    roles = session.exec(stmt).all()
    role_codes = [ur.rol_codigo for ur in roles] if roles else ["CLIENTE"]

    if "ADMIN" in role_codes or "PEDIDOS" in role_codes:
        return svc.get_all(offset, limit, usuario_id=usuario_filter, estado=estado, pedido_id=pedido_id, nombre_cliente=nombre_cliente)
    else:
        return svc.get_all(offset, limit, usuario_id=current_user.id)


@router.get(
    "/usuario/{usuario_id}",
    response_model=PedidoList,
    summary="Listar pedidos de un usuario",
)
def list_pedidos_by_usuario(
    usuario_id: Annotated[int, Path(gt=0, description="ID del usuario")],
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: PedidoService = Depends(get_pedido_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> PedidoList:
    return svc.get_by_usuario(usuario_id, offset, limit)


@router.get(
    "/mi-estado",
    response_model=PedidoEstadoList,
    summary="Ver estado de mis pedidos (frontend-store)",
)
def ver_estado_mis_pedidos(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 12,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(get_current_user),
) -> PedidoEstadoList:
    return svc.get_estado_pedidos(current_user.id, offset=offset, limit=limit)


@router.get(
    "/{pedido_id}/historial",
    summary="Obtener historial de estados del pedido",
)
def get_pedido_historial(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PedidoService = Depends(get_pedido_service),
    _: Usuario = Depends(get_current_user),
) -> list:
    pedido = svc.get_by_id(pedido_id)
    return [h.model_dump() for h in pedido.historial]


@router.get(
    "/{pedido_id}",
    response_model=PedidoPublic,
    summary="Obtener pedido por ID (con detalles e historial)",
)
def get_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PedidoService = Depends(get_pedido_service),
    _: Usuario = Depends(get_current_user),
) -> PedidoPublic:
    return svc.get_by_id(pedido_id)


@router.patch(
    "/{pedido_id}/cancelar",
    response_model=PedidoPublic,
    summary="Cancelar pedido (CLIENTE dueño)",
)
async def cancelar_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    data: CancelarPedidoRequest,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(get_current_user),
) -> PedidoPublic:
    return await svc.cancelar(pedido_id, current_user.id, data.motivo)


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoPublic,
    summary="Avanzar estado del pedido (FSM)",
)
async def avanzar_estado(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    data: PedidoAvanzarEstado,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(require_roles("ADMIN", "STOCK", "PEDIDOS")),
) -> PedidoPublic:
    data.usuario_id = current_user.id
    return await svc.avanzar_estado(pedido_id, data)


@router.delete(
    "/{pedido_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar pedido (soft delete)",
)
def delete_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PedidoService = Depends(get_pedido_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> None:
    svc.soft_delete(pedido_id)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    import logging
    import traceback
    logger = logging.getLogger("app.modules.Pedido.router")
    from app.core.websocket import manager

    try:
        token = websocket.cookies.get("access_token")
        if not token:
            token = websocket.query_params.get("token")

        logger.info(f"[WS] Conexión. Query params: {dict(websocket.query_params)}")

        if not token:
            logger.info("[WS] No token found")
            await websocket.accept()
            await websocket.close(code=1008, reason="Token requerido")
            return

        payload = decode_access_token(token)
        if not payload:
            logger.info("[WS] Token inválido")
            await websocket.accept()
            await websocket.close(code=1008, reason="Token inválido")
            return

        user_id = payload.get("sub")
        if not user_id:
            logger.info("[WS] Token sin sub")
            await websocket.accept()
            await websocket.close(code=1008, reason="Token inválido")
            return

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            logger.info("[WS] Token con sub inválido")
            await websocket.accept()
            await websocket.close(code=1008, reason="Token inválido")
            return

        with Session(engine) as db_session:
            user = db_session.get(Usuario, user_id)
            if not user or not user.activo:
                logger.info(f"[WS] Usuario {user_id} inactivo")
                await websocket.accept()
                await websocket.close(code=1008, reason="Usuario inactivo")
                return

            stmt = select(UsuarioRol).where(UsuarioRol.usuario_id == user_id)
            roles = db_session.exec(stmt).all()
            role_codes = [ur.rol_codigo for ur in roles] if roles else ["CLIENTE"]
            user_role = role_codes[0] if role_codes else "CLIENTE"
            logger.info(f"[WS] Usuario {user_id} rol: {user_role}")

        await manager.connect(websocket, user_role, user_id)
        logger.info(f"[WS] Rooms: {manager.get_rooms_info()}")

        if user_role == "ADMIN":
            manager._join_room(websocket, "role:admin")

        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            action = msg.get("action")

            if action == "subscribe-order":
                order_id = msg.get("order_id")
                if not order_id or not isinstance(order_id, int):
                    continue

                if user_role not in ("ADMIN", "PEDIDOS", "STOCK"):
                    with Session(engine) as db_session:
                        from app.modules.Pedido.unit_of_work import PedidoUnitOfWork
                        pedido_uow = PedidoUnitOfWork(db_session)
                        pedido = pedido_uow.pedidos.get_active_by_id(order_id)
                        if not pedido or pedido.usuario_id != user_id:
                            await websocket.send_json({
                                "event": "ERROR",
                                "data": {"detail": "No autorizado"}
                            })
                            continue

                manager.join_order_room(websocket, order_id)
                await websocket.send_json({
                    "event": "SUBSCRIBED",
                    "data": {"order_id": order_id}
                })

            elif action == "unsubscribe-order":
                order_id = msg.get("order_id")
                if order_id and isinstance(order_id, int):
                    manager.leave_order_room(websocket, order_id)

    except WebSocketDisconnect:
        logger.info("[WS] Cliente desconectado")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"[WS] Error: {e}")
        logger.error(traceback.format_exc())
        try:
            await websocket.close(code=1011, reason=str(e))
        except:
            pass
        manager.disconnect(websocket)