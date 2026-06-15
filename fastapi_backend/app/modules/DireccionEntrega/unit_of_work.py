from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.DireccionEntrega.repository import DireccionEntregaRepository


class DireccionEntregaUnitOfWork(UnitOfWork):
    def __init__(self, session: Session) -> None:
        super().__init__(session)
        self.direcciones = DireccionEntregaRepository(session)