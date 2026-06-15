from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.DireccionEntrega.models import DireccionEntrega


class DireccionEntregaRepository(BaseRepository[DireccionEntrega]):
    def __init__(self, session: Session):
        super().__init__(session, DireccionEntrega)

    def get_by_usuario(self,usuario_id: int,offset: int = 0,limit: int = 20,) -> list[DireccionEntrega]:
        return list(
            self.session.exec(
                select(DireccionEntrega)
                .where(
                    DireccionEntrega.usuario_id == usuario_id,
                    DireccionEntrega.deleted_at == None,
                )
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def count_by_usuario(self, usuario_id: int) -> int:
        return len(
            self.session.exec(
                select(DireccionEntrega)
                .where(
                    DireccionEntrega.usuario_id == usuario_id,
                    DireccionEntrega.deleted_at == None,
                )
            ).all()
        )

    def get_principal(self, usuario_id: int) -> DireccionEntrega | None:
        return self.session.exec(
            select(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.es_principal == True,
                DireccionEntrega.deleted_at == None,
            )
        ).first()

    def get_active_by_id(self, direccion_id: int) -> DireccionEntrega | None:
        return self.session.exec(
            select(DireccionEntrega)
            .where(
                DireccionEntrega.id == direccion_id,
                DireccionEntrega.deleted_at == None,
            )
        ).first()