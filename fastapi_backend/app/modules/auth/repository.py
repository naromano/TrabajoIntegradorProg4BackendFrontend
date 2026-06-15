from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.auth.models import RefreshToken
from datetime import datetime, timezone


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, session: Session):
        super().__init__(session, RefreshToken)

    def get_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        return self.session.exec(
            select(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
        ).first()

    def get_active_by_usuario(self, usuario_id: int) -> list[RefreshToken]:
        return list(
            self.session.exec(
                select(RefreshToken)
                .where(
                    RefreshToken.usuario_id == usuario_id,
                    RefreshToken.revoked_at == None,
                    RefreshToken.expires_at > datetime.now(timezone.utc)
                )
            ).all()
        )

    def get_valid_token(self, token_hash: str) -> RefreshToken | None:
        return self.session.exec(
            select(RefreshToken)
            .where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at == None,
                RefreshToken.expires_at > datetime.now(timezone.utc)
            )
        ).first()

    def revoke(self, token: RefreshToken) -> None:
        token.revoked_at = datetime.now(timezone.utc)
        self.session.add(token)
        self.session.flush()

    def revoke_all_by_usuario(self, usuario_id: int) -> None:
        tokens = self.get_active_by_usuario(usuario_id)
        for token in tokens:
            token.revoked_at = datetime.now(timezone.utc)
            self.session.add(token)
        self.session.flush()

    def delete_expired(self) -> int:
        tokens = list(
            self.session.exec(
                select(RefreshToken)
                .where(RefreshToken.expires_at < datetime.now(timezone.utc))
            ).all()
        )
        for token in tokens:
            self.session.delete(token)
        self.session.flush()
        return len(tokens)
