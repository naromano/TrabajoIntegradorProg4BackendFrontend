from sqlmodel import Session
from app.modules.rol.models import Rol


def seed_roles(session: Session):

    roles = [
        Rol(
            codigo="ADMIN",
            nombre="Administrador",
            descripcion="Acceso total"
        ),
        Rol(
            codigo="STOCK",
            nombre="Stock",
            descripcion="Gestión de stock"
        ),
        Rol(
            codigo="PEDIDOS",
            nombre="Pedidos",
            descripcion="Gestión de pedidos"
        ),
        Rol(
            codigo="CLIENTE",
            nombre="Cliente",
            descripcion="Usuario cliente"
        )
    ]

    for rol in roles:
        if not session.get(Rol, rol.codigo):
            session.add(rol)

    session.commit()