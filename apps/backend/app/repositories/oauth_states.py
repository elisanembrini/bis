from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import OAuthState


def add(
    db: Session,
    *,
    state_hash: str,
    code_verifier: str,
    redirect: str | None,
    created_at: datetime,
    expires_at: datetime,
) -> OAuthState:
    oauth_state = OAuthState(
        state_hash=state_hash,
        code_verifier=code_verifier,
        redirect=redirect,
        created_at=created_at,
        expires_at=expires_at,
    )
    db.add(oauth_state)
    db.flush()
    return oauth_state


def get_usable_for_update(db: Session, state_hash: str, now: datetime) -> OAuthState | None:
    return db.scalar(
        select(OAuthState)
        .where(
            OAuthState.state_hash == state_hash,
            OAuthState.used_at.is_(None),
            OAuthState.expires_at > now,
        )
        .with_for_update()
    )
