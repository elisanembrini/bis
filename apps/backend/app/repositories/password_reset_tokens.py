import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PasswordResetToken


def add(
    db: Session, *, user_id: uuid.UUID, token_hash: str, created_at: datetime, expires_at: datetime
) -> PasswordResetToken:
    token = PasswordResetToken(
        user_id=user_id, token_hash=token_hash, created_at=created_at, expires_at=expires_at
    )
    db.add(token)
    db.flush()
    return token


def get_usable_for_update(db: Session, token_hash: str, now: datetime) -> PasswordResetToken | None:
    return db.scalar(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
        .with_for_update()
    )
