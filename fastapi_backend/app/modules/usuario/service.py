from fastapi import HTTPException, status
from sqlmodel import Session
from datetime import datetime, timezone
from passlib.context import CryptContext

from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.usuario.schemas import (
    UsuarioCreate, UsuarioPublic, UsuarioUpdate, UsuarioList,
    UsuarioRolCreate, UsuarioRolPublic, UsuarioRolList
)
from app.modules.usuario.unit_of_work import UsuarioUnitOfWork


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


class UsuarioService:
    def __init__(self, session: Session) -> None:
        self._session = session


    def _get_or_404(self, uow: UsuarioUnitOfWork, usuario_id: int) -> Usuario:
        usuario = uow.usuarios.get_by_id(usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario con id={usuario_id} no encontrado",
            )
        return usuario


    def _assert_email_unique(self,uow: UsuarioUnitOfWork,email: str,exclude_id: int | None = None,) -> None:
        usuario = uow.usuarios.get_by_email(email)
        if usuario and usuario.id != exclude_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El email '{email}' ya está en uso",
            )


    def _get_relacion_or_404(self,uow: UsuarioUnitOfWork,usuario_id: int,rol_codigo: str,) -> UsuarioRol:
        relacion = uow.usuario_roles.get_relacion(usuario_id, rol_codigo)
        if not relacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relación usuario={usuario_id} rol={rol_codigo} no encontrada",
            )
        return relacion


    def _assert_relacion_not_exists(self,uow: UsuarioUnitOfWork,usuario_id: int,rol_codigo: str,) -> None:
        if uow.usuario_roles.exists(usuario_id, rol_codigo):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El usuario id={usuario_id} ya tiene el rol '{rol_codigo}'",
            )


    def create(self, data: UsuarioCreate) -> UsuarioPublic:
        with UsuarioUnitOfWork(self._session) as uow:
            self._assert_email_unique(uow, data.email)
            payload = data.model_dump()
            password = payload.pop("password")
            usuario = Usuario(
                **payload,
                password_hash=hash_password(password)
            )
            uow.usuarios.add(usuario)


            rol = UsuarioRol(
                usuario_id=usuario.id,
                rol_codigo="CLIENTE",
            )
            uow.usuario_roles.add(rol)

            result = UsuarioPublic.model_validate(usuario.model_dump(exclude={'roles'}))
        return result


    def get_all(self, offset: int = 0, limit: int = 20, search: str | None = None) -> UsuarioList:
        with UsuarioUnitOfWork(self._session) as uow:
            usuarios = uow.usuarios.get_active(offset=offset, limit=limit, search=search)
            total = uow.usuarios.count(search=search)
            result = UsuarioList(
                data=[
                    UsuarioPublic(
                        **u.model_dump(),
                        rol=u.roles[0].rol_codigo if u.roles else None,
                    )
                    for u in usuarios
                ],
                total=total,
            )
        return result


    def get_by_id(self, usuario_id: int) -> UsuarioPublic:
        with UsuarioUnitOfWork(self._session) as uow:
            usuario = self._get_or_404(uow, usuario_id)
            result = UsuarioPublic.model_validate(usuario.model_dump(exclude={'roles'}))
        return result


    def update(self,usuario_id: int,data: UsuarioUpdate,) -> UsuarioPublic:
        with UsuarioUnitOfWork(self._session) as uow:
            usuario = self._get_or_404(uow, usuario_id)
            patch = data.model_dump(exclude_unset=True)

            if "email" in patch:
                self._assert_email_unique(uow,patch["email"],exclude_id=usuario.id,)

            if "password" in patch:
                patch["password_hash"] = hash_password(
                    patch.pop("password")
                )

            for field, value in patch.items():
                setattr(usuario, field, value)

            usuario.updated_at = _now()
            uow.usuarios.add(usuario)
            result = UsuarioPublic.model_validate(usuario.model_dump(exclude={'roles'}))

        return result


    def soft_delete(self, usuario_id: int) -> None:
        with UsuarioUnitOfWork(self._session) as uow:
            usuario = self._get_or_404(uow, usuario_id)
            usuario.activo = False
            usuario.deleted_at = _now()
            usuario.updated_at = _now()
            uow.usuarios.add(usuario)


    def create_rol(self,data: UsuarioRolCreate,) -> UsuarioRolPublic:
        with UsuarioUnitOfWork(self._session) as uow:
            self._get_or_404(uow, data.usuario_id)
            self._assert_relacion_not_exists(uow,data.usuario_id,data.rol_codigo,)
            relacion = UsuarioRol.model_validate(data)
            uow.usuario_roles.add(relacion)
            result = UsuarioRolPublic.model_validate(relacion)
        return result


    def get_roles(self,usuario_id: int,) -> UsuarioRolList:
        with UsuarioUnitOfWork(self._session) as uow:
            relaciones = uow.usuario_roles.get_by_usuario(usuario_id)
            result = UsuarioRolList(
                data=[UsuarioRolPublic.model_validate(r)for r in relaciones],
                total=len(relaciones),
            )
        return result


    def delete_rol(self,usuario_id: int,rol_codigo: str,) -> None:
        with UsuarioUnitOfWork(self._session) as uow:
            relacion = self._get_relacion_or_404(uow,usuario_id,rol_codigo,)
            uow.usuario_roles.delete(relacion)