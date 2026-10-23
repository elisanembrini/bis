from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import LoginAttempt


def add(db: Session, *, email: str, ip: str, succeeded: bool, attempted_at: datetime) -> None:
    db.add(LoginAttempt(email=email, ip=ip, succeeded=succeeded, attempted_at=attempted_at))
    db.flush()


def last_success_for_email(db: Session, email: str, since: datetime) -> datetime | None:
    return db.scalar(
        select(func.max(LoginAttempt.attempted_at)).where(
            LoginAttempt.email == email,
            LoginAttempt.succeeded.is_(True),
            LoginAttempt.attempted_at > since,
        )
    )


def failures_for_email(db: Session, email: str, since: datetime) -> list[datetime]:
    return list(
        db.scalars(
            select(LoginAttempt.attempted_at)
            .where(
                LoginAttempt.email == email,
                LoginAttempt.succeeded.is_(False),
                LoginAttempt.attempted_at > since,
            )
            .order_by(LoginAttempt.attempted_at)
        )
    )


def failures_for_ip(db: Session, ip: str, since: datetime) -> list[datetime]:
    return list(
        db.scalars(
            select(LoginAttempt.attempted_at)
            .where(
                LoginAttempt.ip == ip,
                LoginAttempt.succeeded.is_(False),
                LoginAttempt.attempted_at > since,
            )
            .order_by(LoginAttempt.attempted_at)
        )
    )
