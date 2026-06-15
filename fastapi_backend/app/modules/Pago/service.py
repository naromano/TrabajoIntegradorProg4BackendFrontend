from fastapi import HTTPException, status
from sqlmodel import Session
from datetime import datetime, timezone
import asyncio
import uuid
import json
import logging
import mercadopago

from app.core.config import settings
from app.modules.Pago.models import Pago
from app.modules.Pago.schemas import (
    PagoPreferenciaResponse, PagoPublic, PagoList, ConfirmarPagoRequest
)
from app.modules.Pago.unit_of_work import PagoUnitOfWork

logger = logging.getLogger("app.modules.Pago.service")


def _now() -> datetime:
    return datetime.now(timezone.utc)


sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)


class PagoService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_pedido_or_404(self, uow: PagoUnitOfWork, pedido_id: int):
        from app.modules.Pedido.models import Pedido
        pedido = uow.pagos.session.get(Pedido, pedido_id)
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido con id={pedido_id} no encontrado",
            )
        return pedido

    def _assert_es_dueno(self, pedido, usuario_id: int) -> None:
        if pedido.usuario_id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenes permiso para pagar este pedido",
            )

    def _assert_pedido_pendiente(self, pedido) -> None:
        if pedido.estado_codigo != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El pedido no esta en estado PENDIENTE (estado actual: {pedido.estado_codigo})",
            )

    def _calcular_monto(self, pedido) -> float:
        return float(pedido.total)

    def crear_preferencia(self, pedido_id: int, usuario_id: int) -> PagoPreferenciaResponse:
        with PagoUnitOfWork(self._session) as uow:
            pedido = self._get_pedido_or_404(uow, pedido_id)
            self._assert_es_dueno(pedido, usuario_id)
            self._assert_pedido_pendiente(pedido)

            monto = self._calcular_monto(pedido)
            external_reference = f"pedido-{pedido_id}-{uuid.uuid4().hex[:8]}"
            idempotency_key = str(uuid.uuid4())

            notification_url = (
                settings.MP_WEBHOOK_URL
                or f"{settings.BACKEND_URL}/api/v1/pagos/webhook"
            )
            back_url = settings.NGROK_URL or settings.BACKEND_URL

            preference_data = {
                "items": [{
                    "title": f"Pedido #{pedido_id} - Food Store",
                    "quantity": 1,
                    "unit_price": monto,
                    "currency_id": "ARS",
                }],
                "external_reference": external_reference,
                "back_urls": {
                    "success": f"{back_url}/api/v1/pagos/redirect/{pedido_id}/success",
                    "failure": f"{back_url}/api/v1/pagos/redirect/{pedido_id}/failure",
                    "pending": f"{back_url}/api/v1/pagos/redirect/{pedido_id}/pending",
                },
                "notification_url": notification_url,
                "auto_return": "approved",
            }

            respuesta = sdk.preference().create(preference_data)
            if respuesta["status"] not in (200, 201):
                logger.error(f"Error MP Preference: {respuesta}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Error al crear preferencia en MercadoPago",
                )

            preference = respuesta["response"]

            pago = Pago(
                pedido_id=pedido_id,
                mp_preference_id=preference["id"],
                mp_init_point=preference.get("init_point", preference.get("sandbox_init_point", "")),
                mp_status="pending",
                external_reference=external_reference,
                idempotency_key=idempotency_key,
                transaction_amount=pedido.total,
            )
            uow.pagos.add(pago)

            result = PagoPreferenciaResponse(
                preference_id=preference["id"],
                init_point=preference.get("init_point", preference.get("sandbox_init_point", "")),
                public_key=settings.MP_PUBLIC_KEY,
            )

        return result

    async def _avanzar_pedido_confirmado(self, uow: PagoUnitOfWork, pedido_id: int, pago: Pago) -> None:
        from app.modules.Pedido.models import Pedido
        from app.modules.Pedido.service import PedidoService
        from app.modules.Pedido.schemas import PedidoAvanzarEstado

        pedido = uow.pagos.session.get(Pedido, pedido_id)
        if not pedido or pedido.estado_codigo != "PENDIENTE":
            return

        pedido_svc = PedidoService(self._session)
        await pedido_svc.avanzar_estado(
            pedido_id,
            PedidoAvanzarEstado(
                estado_hacia_codigo="CONFIRMADO",
                motivo=None,
                usuario_id=pedido.usuario_id,
            )
        )

    def _actualizar_pago_desde_mp(self, pago: Pago, pago_mp: dict, payment_id: str) -> None:
        pago.mp_payment_id = int(payment_id)
        pago.mp_status = pago_mp.get("status", pago.mp_status)
        pago.mp_status_detail = pago_mp.get("status_detail", "")
        pago.payment_method_id = pago_mp.get("payment_method_id", "")
        pago.updated_at = _now()

    async def procesar_webhook(
        self,
        payload: dict | None,
        query_params: dict | None = None,
        x_signature: str | None = None,
        x_request_id: str | None = None,
    ) -> dict:
        try:
            if x_signature and settings.MP_WEBHOOK_SECRET:
                import hashlib
                import hmac

                ts = x_signature.split(",")[0].split("=")[1] if "ts=" in x_signature else ""
                v1 = x_signature.split(",")[1].split("=")[1] if "v1=" in x_signature else ""

                manifest = f"id:{x_request_id or ''};request-id:{x_request_id or ''};ts:{ts};"
                expected = hmac.new(
                    settings.MP_WEBHOOK_SECRET.encode(),
                    manifest.encode(),
                    hashlib.sha256,
                ).hexdigest()

                if not hmac.compare_digest(v1, expected):
                    logger.warning("[MP Webhook] Firma invalida")
                    return {"status": "firma_invalida"}

            pago_id = None
            pago_topic = None

            if payload:
                pago_topic = payload.get("type") or payload.get("action")
                data = payload.get("data", {})
                pago_id = data.get("id") if isinstance(data, dict) else None

            if not pago_id and query_params:
                pago_id = query_params.get("id") or query_params.get("data.id")
                pago_topic = query_params.get("topic") or query_params.get("type")

            if not pago_id or pago_topic != "payment":
                return {"status": "ignorado"}

            pago_id = str(pago_id)
            logger.info(f"[MP Webhook] Procesando payment_id={pago_id}")

            resultado = sdk.payment().get(int(pago_id))
            if resultado["status"] not in (200, 201):
                logger.warning(f"[MP Webhook] No se pudo obtener payment {pago_id}: {resultado}")
                return {"status": "error_consultando_mp"}

            pago_mp = resultado["response"]
            mp_status = pago_mp.get("status", "")
            ext_ref = pago_mp.get("external_reference", "")

            with PagoUnitOfWork(self._session) as uow:
                pago = uow.pagos.get_by_external_reference(ext_ref)
                if not pago:
                    logger.warning(f"[MP Webhook] Pago no encontrado para ext_ref={ext_ref}")
                    return {"status": "pago_no_encontrado"}

                if pago.mp_status == "approved":
                    logger.info(f"[MP Webhook] Pago {pago.id} ya esta aprobado, ignorando")
                    return {"status": "ya_aprobado"}

                self._actualizar_pago_desde_mp(pago, pago_mp, pago_id)
                uow.pagos.add(pago)

                if mp_status == "approved":
                    await self._avanzar_pedido_confirmado(uow, pago.pedido_id, pago)

            logger.info(f"[MP Webhook] Pago {pago.id} actualizado a {mp_status}")
            return {"status": "ok", "mp_status": mp_status}

        except Exception as e:
            logger.error(f"[MP Webhook] Error inesperado: {e}")
            return {"status": "error", "detail": str(e)}

    def confirmar_pago(self, data: ConfirmarPagoRequest) -> dict:
        resultado = sdk.payment().get(int(data.payment_id))
        if resultado["status"] not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No se pudo obtener el pago de MercadoPago",
            )

        pago_mp = resultado["response"]
        mp_status = pago_mp.get("status", "")
        ext_ref = pago_mp.get("external_reference", "")

        with PagoUnitOfWork(self._session) as uow:
            pago = uow.pagos.get_by_external_reference(ext_ref)
            if not pago:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pago no encontrado",
                )

            if pago.mp_status != "approved":
                self._actualizar_pago_desde_mp(pago, pago_mp, data.payment_id)
                uow.pagos.add(pago)

                if mp_status == "approved":
                    asyncio.run(self._avanzar_pedido_confirmado(uow, pago.pedido_id, pago))

        return {
            "pedido_id": pago.pedido_id,
            "mp_status": pago.mp_status,
            "mp_status_detail": pago.mp_status_detail,
        }

    def get_by_pedido(self, pedido_id: int) -> PagoPublic:
        with PagoUnitOfWork(self._session) as uow:
            pago = uow.pagos.get_by_pedido_id(pedido_id)
            if not pago:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se encontro pago para el pedido id={pedido_id}",
                )
            result = PagoPublic.model_validate(pago)
        return result

    def get_all(self) -> PagoList:
        with PagoUnitOfWork(self._session) as uow:
            pagos = uow.pagos.get_all()
            result = PagoList(
                data=[PagoPublic.model_validate(p) for p in pagos],
                total=len(pagos),
            )
        return result
