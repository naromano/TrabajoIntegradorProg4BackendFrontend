from typing import Optional
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.core.repository import BaseRepository
from app.modules.Pedido.models import Pedido
from app.modules.DetallePedido.models import DetallePedido
from app.modules.HistorialEstadoPedido.models import HistorialEstadoPedido
from app.modules.usuario.models import Usuario


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(session, Pedido)

    def get_all(
        self, offset: int = 0, limit: int = 20, usuario_id: Optional[int] = None,
        estado: Optional[str] = None, pedido_id: Optional[int] = None,
        nombre_cliente: Optional[str] = None,
    ) -> list[Pedido]:
        stmt = select(Pedido).where(Pedido.deleted_at == None)
        if usuario_id is not None:
            stmt = stmt.where(Pedido.usuario_id == usuario_id)
        if estado:
            stmt = stmt.where(Pedido.estado_codigo == estado)
        if pedido_id is not None:
            stmt = stmt.where(Pedido.id == pedido_id)
        if nombre_cliente:
            stmt = stmt.join(Usuario).where(
                Usuario.nombre.ilike(f"%{nombre_cliente}%") |
                Usuario.apellido.ilike(f"%{nombre_cliente}%")
            )
        stmt = stmt.options(selectinload(Pedido.usuario))
        return list(
            self.session.exec(
                stmt.order_by(Pedido.created_at.desc()).offset(offset).limit(limit)
            ).all()
        )

    def count(
        self, usuario_id: Optional[int] = None, estado: Optional[str] = None,
        pedido_id: Optional[int] = None, nombre_cliente: Optional[str] = None,
    ) -> int:
        stmt = select(Pedido).where(Pedido.deleted_at == None)
        if usuario_id is not None:
            stmt = stmt.where(Pedido.usuario_id == usuario_id)
        if estado:
            stmt = stmt.where(Pedido.estado_codigo == estado)
        if pedido_id is not None:
            stmt = stmt.where(Pedido.id == pedido_id)
        if nombre_cliente:
            stmt = stmt.join(Usuario).where(
                Usuario.nombre.ilike(f"%{nombre_cliente}%") |
                Usuario.apellido.ilike(f"%{nombre_cliente}%")
            )
        return len(self.session.exec(stmt).all())

    def get_by_usuario(self,usuario_id: int,offset: int = 0,limit: int = 20,) -> list[Pedido]:
        return list(
            self.session.exec(
                select(Pedido)
                .where(
                    Pedido.usuario_id == usuario_id,
                    Pedido.deleted_at == None,
                )
                .order_by(Pedido.created_at.desc())
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_active_by_id(self, pedido_id: int) -> Pedido | None:
        return self.session.exec(
            select(Pedido)
            .where(
                Pedido.id == pedido_id,
                Pedido.deleted_at == None,
            )
            .options(
                selectinload(Pedido.usuario),
                selectinload(Pedido.direccion),
            )
        ).first()

    def get_active_by_usuario(self, usuario_id: int, offset: int = 0, limit: int = 12) -> list[Pedido]:
        return list(
            self.session.exec(
                select(Pedido)
                .where(
                    Pedido.usuario_id == usuario_id,
                    Pedido.deleted_at == None,
                )
                .options(selectinload(Pedido.detalles))
                .order_by(Pedido.created_at.desc())
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def count_by_usuario(self, usuario_id: int) -> int:
        return len(
            self.session.exec(
                select(Pedido)
                .where(
                    Pedido.usuario_id == usuario_id,
                    Pedido.deleted_at == None,
                )
            ).all()
        )


class DetallePedidoRepository(BaseRepository[DetallePedido]):
    def __init__(self, session: Session):
        super().__init__(session, DetallePedido)

    def get_by_pedido(self, pedido_id: int) -> list[DetallePedido]:
        return list(
            self.session.exec(
                select(DetallePedido)
                .where(DetallePedido.pedido_id == pedido_id)
            ).all()
        )


class HistorialEstadoRepository(BaseRepository[HistorialEstadoPedido]):
    def __init__(self, session: Session):
        super().__init__(session, HistorialEstadoPedido)

    def get_by_pedido(self, pedido_id: int) -> list[HistorialEstadoPedido]:
        return list(
            self.session.exec(
                select(HistorialEstadoPedido)
                .where(HistorialEstadoPedido.pedido_id == pedido_id)
                .order_by(HistorialEstadoPedido.created_at)
            ).all()
        )