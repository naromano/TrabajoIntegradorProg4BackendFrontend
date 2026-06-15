
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.core.repository import BaseRepository
from app.modules.producto.models import Producto, ProductoCategoria, ProductoIngrediente


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def _load_relations(self, stmt):
        return stmt.options(
            selectinload(Producto.producto_ingredientes),
            selectinload(Producto.producto_categorias),
        )

    def get_by_id(self, record_id: int) -> Producto | None:
        stmt = self._load_relations(
            select(Producto).where(Producto.id == record_id)
        )
        return self.session.exec(stmt).first()

    def get_all_paged(self, offset: int = 0, limit: int = 20, nombre: str | None = None, incluir_desactivados: bool = False, categoria_id: int | None = None, sin_ingredientes: bool = False) -> list[Producto]:
        stmt = select(Producto)
        if not incluir_desactivados:
            stmt = stmt.where(Producto.deleted_at == None)
        if nombre:
            stmt = stmt.where(Producto.nombre.ilike(f"%{nombre}%"))
        if categoria_id is not None:
            stmt = stmt.join(ProductoCategoria).where(ProductoCategoria.categoria_id == categoria_id)
        if sin_ingredientes:
            stmt = stmt.where(
                ~Producto.id.in_(select(ProductoIngrediente.producto_id))
            )
        stmt = self._load_relations(stmt.order_by(Producto.created_at.desc()).offset(offset).limit(limit))
        return list(self.session.exec(stmt).all())

    def get_by_categoria(self, categoria_id: int, offset: int = 0, limit: int = 20) -> list[Producto]:
        stmt = self._load_relations(
            select(Producto)
            .join(ProductoCategoria)
            .where(ProductoCategoria.categoria_id == categoria_id)
            .offset(offset)
            .limit(limit)
        )
        return list(self.session.exec(stmt).all())

    def count(self, nombre: str | None = None, incluir_desactivados: bool = False, categoria_id: int | None = None, sin_ingredientes: bool = False) -> int:
        stmt = select(Producto)
        if not incluir_desactivados:
            stmt = stmt.where(Producto.deleted_at == None)
        if nombre:
            stmt = stmt.where(Producto.nombre.ilike(f"%{nombre}%"))
        if categoria_id is not None:
            stmt = stmt.join(ProductoCategoria).where(ProductoCategoria.categoria_id == categoria_id)
        if sin_ingredientes:
            stmt = stmt.where(
                ~Producto.id.in_(select(ProductoIngrediente.producto_id))
            )
        return len(self.session.exec(stmt).all())


class ProductoCategoriaRepository(BaseRepository[ProductoCategoria]):

    def __init__(self, session: Session) -> None:
        super().__init__(session, ProductoCategoria)

    def get_all_relaciones(self) -> list[ProductoCategoria]:
        return list(self.session.exec(select(ProductoCategoria)).all())

    def get_by_producto(self, producto_id: int) -> list[ProductoCategoria]:
        return list(
            self.session.exec(
                select(ProductoCategoria).where(
                    ProductoCategoria.producto_id == producto_id
                )
            ).all()
        )

    def get_by_pk(self, producto_id: int, categoria_id: int) -> ProductoCategoria | None:
        return self.session.get(ProductoCategoria, (producto_id, categoria_id))

    def exists(self, producto_id: int, categoria_id: int) -> bool:
        return self.get_by_pk(producto_id, categoria_id) is not None


class ProductoIngredienteRepository(BaseRepository[ProductoIngrediente]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, ProductoIngrediente)

    def get_all_relaciones(self) -> list[ProductoIngrediente]:
        return list(self.session.exec(select(ProductoIngrediente)).all())

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