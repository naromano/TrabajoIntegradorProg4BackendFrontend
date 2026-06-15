from typing import Annotated
from fastapi import APIRouter, Depends, Path, Request, status, Query
from fastapi.responses import RedirectResponse
from sqlmodel import Session
import json
import logging

from app.core.config import settings
from app.core.database import get_session
from app.core.security import get_current_user
from app.modules.usuario.models import Usuario
from app.modules.Pago.schemas import (
    PagoCreate, ConfirmarPagoRequest, PagoPreferenciaResponse, PagoPublic, PagoList,
)
from app.modules.Pago.service import PagoService

router = APIRouter()


def get_pago_service(session: Session = Depends(get_session)) -> PagoService:
    return PagoService(session)


@router.post(
    "/preferencia",
    response_model=PagoPreferenciaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear preferencia de pago en MercadoPago",
)
def crear_preferencia(
    data: PagoCreate,
    svc: PagoService = Depends(get_pago_service),
    current_user: Usuario = Depends(get_current_user),
) -> PagoPreferenciaResponse:
    return svc.crear_preferencia(data.pedido_id, current_user.id)


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Webhook de notificaciones de MercadoPago",
)
async def webhook(
    request: Request,
    svc: PagoService = Depends(get_pago_service),
) -> dict:
    x_signature = request.headers.get("x-signature")
    x_request_id = request.headers.get("x-request-id")

    payload = None
    query_params = dict(request.query_params)

    if request.headers.get("content-type", "").startswith("application/json"):
        try:
            payload = await request.json()
        except Exception:
            pass

    if payload is None:
        try:
            form = await request.form()
            payload = dict(form)
        except Exception:
            pass

    return await svc.procesar_webhook(payload, query_params, x_signature, x_request_id)


@router.get(
    "/redirect/{pedido_id}/{status_pago}",
    summary="Redireccion post-pago de MercadoPago",
)
async def redirect_pago(
    pedido_id: int,
    status_pago: str,
    request: Request,
    svc: PagoService = Depends(get_pago_service),
):
    if status_pago == "success":
        payment_id = request.query_params.get("payment_id")
        if payment_id:
            try:
                resultado = svc.confirmar_pago(ConfirmarPagoRequest(pedido_id=pedido_id, payment_id=payment_id))
                logger = logging.getLogger("app.modules.Pago.router")
                logger.info(f"[MP Redirect] Pago confirmado: {resultado}")
            except Exception:
                pass
        redirect_url = f"{settings.FRONTEND_URL}/?pedido_creado={pedido_id}"
    elif status_pago == "failure":
        redirect_url = f"{settings.FRONTEND_URL}/carrito?pago=fallido"
    else:
        redirect_url = f"{settings.FRONTEND_URL}/mis-pedidos"

    return RedirectResponse(url=redirect_url)


@router.post(
    "/confirm",
    status_code=status.HTTP_200_OK,
    summary="Confirmar pago manualmente contra API de MercadoPago",
)
def confirmar_pago(
    data: ConfirmarPagoRequest,
    svc: PagoService = Depends(get_pago_service),
    _: Usuario = Depends(get_current_user),
) -> dict:
    return svc.confirmar_pago(data)


@router.get(
    "/pedido/{pedido_id}",
    response_model=PagoPublic,
    summary="Obtener pago por ID de pedido",
)
def get_pago_por_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PagoService = Depends(get_pago_service),
    _: Usuario = Depends(get_current_user),
) -> PagoPublic:
    return svc.get_by_pedido(pedido_id)


@router.get(
    "/",
    response_model=PagoList,
    summary="Listar todos los pagos (solo ADMIN)",
)
def list_pagos(
    svc: PagoService = Depends(get_pago_service),
    _: Usuario = Depends(get_current_user),
) -> PagoList:
    return svc.get_all()
