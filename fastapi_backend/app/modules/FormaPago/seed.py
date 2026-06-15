from sqlmodel import Session
from app.modules.FormaPago.models import FormaPago
 

def seed_formas_pago(session: Session) -> None:
    formas_pago = [
        FormaPago(
            codigo="MERCADOPAGO",
            descripcion="MercadoPago - Checkout API",
            habilitado=True,
        ),
        FormaPago(
            codigo="EFECTIVO",
            descripcion="Efectivo - Retiro en local",
            habilitado=True,
        ),
        FormaPago(
            codigo="TRANSFERENCIA",
            descripcion="Transferencia bancaria",
            habilitado=True,
        ),
    ]
 
    for forma in formas_pago:
        if not session.get(FormaPago, forma.codigo):
            session.add(forma)
 
    session.commit()
 