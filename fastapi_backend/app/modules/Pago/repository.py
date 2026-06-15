from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.Pago.models import Pago


class PagoRepository(BaseRepository[Pago]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pago)

    def get_by_pedido_id(self, pedido_id: int) -> Pago | None:
        return self.session.exec(
            select(Pago).where(Pago.pedido_id == pedido_id)
        ).first()

    def get_by_external_reference(self, external_reference: str) -> Pago | None:
        return self.session.exec(
            select(Pago).where(Pago.external_reference == external_reference)
        ).first()

    def get_by_mp_payment_id(self, mp_payment_id: int) -> Pago | None:
        return self.session.exec(
            select(Pago).where(Pago.mp_payment_id == mp_payment_id)
        ).first()

    def get_all(self) -> list[Pago]:
        return list(
            self.session.exec(select(Pago)).all()
        )

    def count(self) -> int:
        return len(self.session.exec(select(Pago)).all())