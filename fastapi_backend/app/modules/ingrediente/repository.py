
from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.ingrediente.models import Ingrediente
from app.modules.producto.models import ProductoIngrediente


class IngredienteRepository(BaseRepository[Ingrediente]):
    def __init__(self, session: Session) -> None:

        super().__init__(session, Ingrediente)

    def get_by_nombre(self, nombre: str) -> Ingrediente | None:
        return self.session.exec(
            select(Ingrediente).where(Ingrediente.nombre == nombre)
        ).first()

    def get_all_paged(self, offset: int = 0, limit: int = 20, nombre: str | None = None) -> list[Ingrediente]:
        stmt = select(Ingrediente).where(Ingrediente.activo == True)
        if nombre:
            stmt = stmt.where(Ingrediente.nombre.ilike(f"%{nombre}%"))
        return list(
            self.session.exec(stmt.order_by(Ingrediente.created_at.desc()).offset(offset).limit(limit)).all()
        )

    def count(self, nombre: str | None = None) -> int:
        stmt = select(Ingrediente).where(Ingrediente.activo == True)
        if nombre:
            stmt = stmt.where(Ingrediente.nombre.ilike(f"%{nombre}%"))
        return len(self.session.exec(stmt).all())


class ProductoIngredienteRepository(BaseRepository[ProductoIngrediente]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, ProductoIngrediente)

    def get_by_producto(self, producto_id: int) -> list[ProductoIngrediente]:
        return list(
            self.session.exec(
                select(ProductoIngrediente).where(
                    ProductoIngrediente.producto_id == producto_id
                )
            ).all()
        )

    def get_by_pk(self, producto_id: int, ingrediente_id: int) -> ProductoIngrediente | None:
        return self.session.get(ProductoIngrediente, (producto_id, ingrediente_id))

    def exists(self, producto_id: int, ingrediente_id: int) -> bool:
        return self.get_by_pk(producto_id, ingrediente_id) is not None
