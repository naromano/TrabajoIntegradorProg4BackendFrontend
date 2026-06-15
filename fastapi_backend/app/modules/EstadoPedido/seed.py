from sqlmodel import Session
from app.modules.EstadoPedido.models import EstadoPedido

def seed_estados_pedido(session: Session) -> None:
    estados = [
        EstadoPedido(
            codigo="PENDIENTE",
            descripcion="Pedido pendiente de confirmación",
            orden=1,
            es_terminal=False,
        ),
        EstadoPedido(
            codigo="CONFIRMADO",
            descripcion="Pedido confirmado",
            orden=2,
            es_terminal=False,
        ),
        EstadoPedido(
            codigo="EN_PREP",
            descripcion="Pedido en preparación",
            orden=3,
            es_terminal=False,
        ),
        EstadoPedido(
            codigo="ENTREGADO",
            descripcion="Pedido entregado",
            orden=4,
            es_terminal=True,
        ),
        EstadoPedido(
            codigo="CANCELADO",
            descripcion="Pedido cancelado",
            orden=5,
            es_terminal=True,
        ),
    ]

    for estado in estados:
        if not session.get(EstadoPedido, estado.codigo):
            session.add(estado)

    session.commit()