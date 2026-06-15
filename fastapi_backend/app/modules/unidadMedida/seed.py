from sqlmodel import Session
from app.modules.unidadMedida.models import UnidadMedida


def seed_unidades_medida(session: Session):
    unidades = [
    
        UnidadMedida(nombre="kilogramo", simbolo="kg", tipo="masa"),
        UnidadMedida(nombre="gramo", simbolo="g", tipo="masa"),
        UnidadMedida(nombre="litro", simbolo="L", tipo="volumen"),
        UnidadMedida(nombre="mililitro", simbolo="mL", tipo="volumen"),
        UnidadMedida(nombre="pieza", simbolo="u", tipo="unidad"),
        UnidadMedida(nombre="docena", simbolo="doc", tipo="unidad"),
        UnidadMedida(nombre="metro cuadrado", simbolo="m²", tipo="area"),
    ]

    for um in unidades:
        existente = session.exec(
            session.query(UnidadMedida).where(UnidadMedida.nombre == um.nombre)
        ).first()
        
        if not existente:
            session.add(um)

    session.commit()