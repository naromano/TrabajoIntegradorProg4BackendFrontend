import os
import sys

os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET"] = "test-jwt-secret-key-for-testing-xyz"
os.environ["ADMIN_EMAIL"] = "admin@internal.test"
os.environ["ADMIN_PASSWORD"] = "internal-not-used-directly"

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_pizza.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

import app.core.database as db_module

from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import ARRAY
from sqlalchemy.sql.expression import FunctionElement
from sqlalchemy import types as sqltypes


@compiles(ARRAY, "sqlite")
def _compile_array_sqlite(element, compiler, **kw):
    return compiler.visit_JSON(element, **kw)


try:
    import sqlalchemy.sql.functions as safunc

    @compiles(safunc.Function, "sqlite")
    def _compile_date_trunc_sqlite(element, compiler, **kw):
        if hasattr(element, "name") and element.name == "date_trunc":
            return "date(%s)" % compiler.process(element.clauses.clauses[1], **kw)
        return compiler.visit_function(element, **kw)
except Exception:
    pass


_original_create_db_and_tables = db_module.create_db_and_tables


def _sqlite_safe_create_db_and_tables():
    from sqlmodel import SQLModel

    SQLModel.metadata.create_all(db_module.engine)


db_module.create_db_and_tables = _sqlite_safe_create_db_and_tables

from main import app
from app.core.database import get_session

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.usuario.service import hash_password
from app.modules.producto.models import Producto


@pytest.fixture(scope="function")
def session():
    with Session(db_module.engine) as s:
        yield s


@pytest.fixture(scope="function")
def client(session):
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_user(session):
    existing = session.exec(
        select(Usuario).where(Usuario.email == "Admin@test.com")
    ).first()
    if existing:
        existing.password_hash = hash_password("admin123")
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    user = Usuario(
        nombre="Admin",
        apellido="Test",
        email="Admin@test.com",
        password_hash=hash_password("admin123"),
    )
    session.add(user)
    session.flush()
    session.add(UsuarioRol(usuario_id=user.id, rol_codigo="ADMIN"))
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_headers(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "Admin@test.com", "password": "admin123"},
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def client_user(session):
    existing = session.exec(
        select(Usuario).where(Usuario.email == "cliente@test.com")
    ).first()
    if existing:
        existing.password_hash = hash_password("cliente123")
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    user = Usuario(
        nombre="Cliente",
        apellido="Test",
        email="cliente@test.com",
        password_hash=hash_password("cliente123"),
    )
    session.add(user)
    session.flush()
    session.add(UsuarioRol(usuario_id=user.id, rol_codigo="CLIENTE"))
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(scope="function")
def client_headers(client, client_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "cliente@test.com", "password": "cliente123"},
    )
    assert response.status_code == 200, f"Client login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def producto(session):
    existing = session.exec(
        select(Producto).where(Producto.nombre == "Pizza de Prueba")
    ).first()
    if existing:
        return existing
    prod = Producto(
        nombre="Pizza de Prueba",
        descripcion="Producto creado para tests automatizados",
        precio_base=1000.00,
        disponible=True,
        stock_cantidad=10,
    )
    session.add(prod)
    session.commit()
    session.refresh(prod)
    return prod


def pytest_sessionfinish(session, exitstatus):
    db_module.engine.dispose()
    try:
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
    except PermissionError:
        pass
