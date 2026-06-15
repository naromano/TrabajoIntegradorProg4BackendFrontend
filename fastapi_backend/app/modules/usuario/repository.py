from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.core.repository import BaseRepository
from app.modules.usuario.models import Usuario, UsuarioRol


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: Session):
        super().__init__(session, Usuario)

    def get_active(self, offset: int = 0, limit: int = 20, search: str | None = None) -> list[Usuario]:
        stmt = select(Usuario).where(Usuario.activo == True)
        if search:
            stmt = stmt.where(
                Usuario.nombre.ilike(f"%{search}%") |
                Usuario.apellido.ilike(f"%{search}%") |
                Usuario.email.ilike(f"%{search}%")
            )
        stmt = stmt.options(selectinload(Usuario.roles)).offset(offset).limit(limit)
        return list(self.session.exec(stmt).all())

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario)
            .where(Usuario.email == email)
        ).first()

    def count(self, search: str | None = None) -> int:
        stmt = select(Usuario).where(Usuario.activo == True)
        if search:
            stmt = stmt.where(
                Usuario.nombre.ilike(f"%{search}%") |
                Usuario.apellido.ilike(f"%{search}%") |
                Usuario.email.ilike(f"%{search}%")
            )
        return len(self.session.exec(stmt).all())


class UsuarioRolRepository(BaseRepository[UsuarioRol]):
    def __init__(self, session: Session):
        super().__init__(session, UsuarioRol)

    def get_by_usuario(self,usuario_id: int) -> list[UsuarioRol]:
        return list(
            self.session.exec(
                select(UsuarioRol)
                .where(
                    UsuarioRol.usuario_id == usuario_id
                )
            ).all()
        )

    def get_relacion(self,usuario_id: int,rol_codigo: str) -> UsuarioRol | None:
        return self.session.exec(
            select(UsuarioRol)
            .where(
                UsuarioRol.usuario_id == usuario_id,
                UsuarioRol.rol_codigo == rol_codigo
            )
        ).first()

    def exists(self,usuario_id: int,rol_codigo: str) -> bool:
        return (
            self.get_relacion(
                usuario_id,
                rol_codigo
            )
            is not None
        )