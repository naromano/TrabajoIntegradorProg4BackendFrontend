from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.Pedido.repository import (
    PedidoRepository,
    DetallePedidoRepository,
    HistorialEstadoRepository,
)


class PedidoUnitOfWork(UnitOfWork):
    def __init__(self, session: Session) -> None:
        super().__init__(session)
        self.pedidos = PedidoRepository(session)
        self.detalles = DetallePedidoRepository(session)
        self.historial = HistorialEstadoRepository(session)