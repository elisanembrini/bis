import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Response
from fastapi.security import APIKeyCookie
from sqlalchemy.orm import Session

from app.core.clock import Clock, get_clock
from app.core.errors import UnauthenticatedError
from app.db import get_db
from app.models import User
from app.repositories import sessions, users
from app.services.tokens import hash_token

SESSION_COOKIE_NAME = "bis_session"

session_cookie = APIKeyCookie(name=SESSION_COOKIE_NAME, auto_error=False)


@dataclass(frozen=True)
class Authenticated:
    user: User
    session_id: uuid.UUID


def get_authenticated(
    token: Annotated[str | None, Depends(session_cookie)],
    db: Annotated[Session, Depends(get_db)],
    clock: Annotated[Clock, Depends(get_clock)],
) -> Authenticated:
    if not token:
        raise UnauthenticatedError
    session = sessions.get_active_by_token_hash(db, hash_token(token), clock.now())
    if session is None:
        raise UnauthenticatedError
    user = users.get_by_id(db, session.user_id)
    if user is None:
        raise UnauthenticatedError
    return Authenticated(user=user, session_id=session.id)


def set_session_cookie(response: Response, token: str, max_age_seconds: int) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        path="/",
        httponly=True,
        secure=True,
        samesite="lax",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=True,
        samesite="lax",
    )
