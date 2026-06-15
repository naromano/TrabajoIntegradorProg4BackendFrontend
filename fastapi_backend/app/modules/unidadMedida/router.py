from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import get_session
from app.modules.unidadMedida.models import UnidadMedida

router = APIRouter()

@router.get("/")
def listar_unidades_medida(session: Session = Depends(get_session)):
    return session.exec(select(UnidadMedida)).all()