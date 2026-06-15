import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy import text

load_dotenv()

from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.rol.models import Rol
from app.modules.auth.models import RefreshToken
from app.modules.producto.models import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.categoria.models import Categoria
from app.modules.ingrediente.models import Ingrediente
from app.modules.unidadMedida.models import UnidadMedida
from app.modules.DireccionEntrega.models import DireccionEntrega
from app.modules.FormaPago.models import FormaPago
from app.modules.EstadoPedido.models import EstadoPedido
from app.modules.Pedido.models import Pedido
from app.modules.DetallePedido.models import DetallePedido
from app.modules.HistorialEstadoPedido.models import HistorialEstadoPedido
from app.modules.Pago.models import Pago

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("ENVIRONMENT") != "production",
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    _apply_migrations()


def _apply_migrations():
    with engine.begin() as conn:
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='ingrediente' AND column_name='costo'
                ) THEN
                    ALTER TABLE ingrediente ADD COLUMN costo FLOAT DEFAULT 0 NOT NULL;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='ingrediente' AND column_name='imagen_url'
                ) THEN
                    ALTER TABLE ingrediente ADD COLUMN imagen_url VARCHAR;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='categoria' AND column_name='imagen_url'
                ) THEN
                    ALTER TABLE categoria ADD COLUMN imagen_url VARCHAR;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='usuario' AND column_name='celular'
                ) THEN
                    ALTER TABLE usuario ADD COLUMN celular VARCHAR(20);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='usuario_rol' AND column_name='expires_at'
                ) THEN
                    ALTER TABLE usuario_rol ADD COLUMN expires_at TIMESTAMPTZ;
                END IF;
            END $$;
        """))

        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='producto' AND column_name='stock'
                ) THEN
                    ALTER TABLE producto RENAME COLUMN stock TO stock_cantidad;
                END IF;
            END $$;
        """))

        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='producto' AND column_name='stock_cantidad'
                    AND data_type = 'double precision'
                ) THEN
                    ALTER TABLE producto ALTER COLUMN stock_cantidad TYPE INTEGER USING stock_cantidad::INTEGER;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='producto' AND column_name='stock_cantidad'
                ) THEN
                    ALTER TABLE producto ADD COLUMN stock_cantidad INTEGER DEFAULT 0 NOT NULL;
                END IF;
            END $$;
        """))

        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='producto' AND column_name='imagen_url'
                ) THEN
                    ALTER TABLE producto DROP COLUMN imagen_url;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='producto' AND column_name='imagenes_url'
                ) THEN
                    ALTER TABLE producto ADD COLUMN imagenes_url TEXT[];
                END IF;
            END $$;
        """))

        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='producto' AND column_name='unidad_venta_id'
                ) THEN
                    ALTER TABLE producto ADD COLUMN unidad_venta_id BIGINT;
                    ALTER TABLE producto ADD CONSTRAINT fk_producto_unidad_venta
                        FOREIGN KEY (unidad_venta_id) REFERENCES unidad_medida(id);
                END IF;
            END $$;
        """))

        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='ingrediente' AND column_name='stock_cantidad'
                    AND data_type = 'double precision'
                ) THEN
                    ALTER TABLE ingrediente ALTER COLUMN stock_cantidad TYPE INTEGER USING stock_cantidad::INTEGER;
                END IF;
            END $$;
        """))


def get_session():
    with Session(engine) as session:
        yield session           