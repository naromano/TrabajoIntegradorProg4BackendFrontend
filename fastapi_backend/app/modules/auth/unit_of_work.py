from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.auth.repository import RefreshTokenRepository


class RefreshTokenUnitOfWork(UnitOfWork):
    def __init__(self, session: Session) -> None:
        super().__init__(session)
        self.refresh_tokens = RefreshTokenRepository(session)

    def __enter__(self) -> "RefreshTokenUnitOfWork":
        return self
