
from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.categoria.models import Categoria
from sqlalchemy import func

class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        return self.session.exec(
            select(Categoria).where(Categoria.nombre == nombre)
        ).first()

    def get_active(self, offset: int = 0, limit: int = 20) -> list[Categoria]:
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.activo == True)  
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_parent(self, parent_id: int, offset: int = 0, limit: int = 20) -> list[Categoria]:
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.parent_id == parent_id)
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def count(self) -> int:
        return self.session.exec(
            select(func.count())
            .select_from(Categoria)
            .where(Categoria.activo == True)
        ).one()
