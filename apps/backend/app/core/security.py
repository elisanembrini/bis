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
OAUTH_STATE_COOKIE_NAME = "bis_oauth_state"

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


def _set_cookie(response: Response, name: str, value: str, max_age_seconds: int) -> None:
    response.set_cookie(
        key=name,
        value=value,
        max_age=max_age_seconds,
        path="/",
        httponly=True,
        secure=True,
        samesite="lax",
    )


def _clear_cookie(response: Response, name: str) -> None:
    response.delete_cookie(key=name, path="/", httponly=True, secure=True, samesite="lax")


def set_session_cookie(response: Response, token: str, max_age_seconds: int) -> None:
    _set_cookie(response, SESSION_COOKIE_NAME, token, max_age_seconds)


def clear_session_cookie(response: Response) -> None:
    _clear_cookie(response, SESSION_COOKIE_NAME)


def set_oauth_state_cookie(response: Response, state: str, max_age_seconds: int) -> None:
    _set_cookie(response, OAUTH_STATE_COOKIE_NAME, state, max_age_seconds)


def clear_oauth_state_cookie(response: Response) -> None:
    _clear_cookie(response, OAUTH_STATE_COOKIE_NAME)
