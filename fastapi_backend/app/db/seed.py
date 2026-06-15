"""
Script de seed independiente para cargar datos iniciales.
Ejecutar desde fastapi_backend/:
    python -m app.db.seed
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dotenv import load_dotenv
load_dotenv()

from sqlmodel import Session, select
from app.core.database import engine, create_db_and_tables
from app.modules.usuario.models import Usuario
from app.modules.usuario.service import hash_password
from app.modules.usuario.models import UsuarioRol
from app.modules.rol.seed import seed_roles
from app.modules.FormaPago.seed import seed_formas_pago
from app.modules.EstadoPedido.seed import seed_estados_pedido
from app.modules.unidadMedida.seed import seed_unidades_medida
from app.seed_data import seed_all_data


def run():
    print("Creando tablas si no existen...")
    create_db_and_tables()

    with Session(engine) as session:
        print("Sembrando roles...")
        seed_roles(session)

        print("Sembrando formas de pago...")
        seed_formas_pago(session)

        print("Sembrando estados de pedido...")
        seed_estados_pedido(session)

        print("Sembrando unidades de medida...")
        seed_unidades_medida(session)

        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        if admin_email and admin_password:
            existing = session.exec(
                select(Usuario).where(Usuario.email == admin_email)
            ).first()
            if not existing:
                print(f"Creando admin: {admin_email}")
                admin = Usuario(
                    nombre="Admin",
                    apellido="Sistema",
                    email=admin_email,
                    password_hash=hash_password(admin_password),
                )
                session.add(admin)
                session.flush()
                admin_rol = UsuarioRol(
                    usuario_id=admin.id,
                    rol_codigo="ADMIN",
                )
                session.add(admin_rol)
                session.commit()
                print("Admin creado exitosamente.")
            else:
                print("Admin ya existe, saltando.")
        else:
            print("ADVERTENCIA: ADMIN_EMAIL/ADMIN_PASSWORD no configurados, admin no creado.")

        print("Sembrando datos de prueba (productos, usuarios, pedidos)...")
        seed_all_data(session)

    print("Seed completado exitosamente.")


if __name__ == "__main__":
    run()
