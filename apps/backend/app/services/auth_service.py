import math
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.clock import Clock, get_clock
from app.core.config import Settings, get_settings
from app.core.errors import (
    EmailAlreadyRegisteredError,
    GoogleLoginError,
    InvalidCredentialsError,
    ResetTokenInvalidError,
    TooManyAttemptsError,
)
from app.db import get_db
from app.models import User
from app.repositories import (
    households,
    login_attempts,
    oauth_states,
    password_reset_tokens,
    sessions,
    users,
)
from app.schemas.auth import HouseholdRole, HouseholdSummary, MeResponse
from app.schemas.errors import ErrorCode
from app.services.email_sender import EmailSender, get_email_sender
from app.services.emails import build_password_reset_email, password_reset_link
from app.services.google_oauth import GoogleIdentity, GoogleOAuthClient, GoogleOAuthError
from app.services.password_hasher import PasswordHasher, get_password_hasher
from app.services.pkce import code_challenge_s256, generate_code_verifier
from app.services.tokens import generate_token, hash_token


@dataclass(frozen=True)
class OpenedSession:
    user: User
    token: str
    max_age_seconds: int


@dataclass(frozen=True)
class GoogleLoginStart:
    authorization_url: str
    state: str
    max_age_seconds: int


@dataclass(frozen=True)
class GoogleLoginResult:
    opened: OpenedSession
    redirect: str | None


DISPLAY_NAME_MAX_LENGTH = 100


class AuthService:
    def __init__(
        self,
        db: Session,
        clock: Clock,
        settings: Settings,
        hasher: PasswordHasher,
        email_sender: EmailSender,
    ) -> None:
        self._db = db
        self._clock = clock
        self._settings = settings
        self._hasher = hasher
        self._email_sender = email_sender

    def register(self, *, email: str, password: str, display_name: str) -> OpenedSession:
        if users.get_by_email(self._db, email) is not None:
            raise EmailAlreadyRegisteredError
        try:
            user = users.add(
                self._db,
                email=email,
                password_hash=self._hasher.hash(password),
                display_name=display_name,
            )
            households.add_with_owner(self._db, user.id)
            opened = self._open_session(user, self._clock.now())
            self._db.commit()
        except IntegrityError as exc:
            self._db.rollback()
            raise EmailAlreadyRegisteredError from exc
        return opened

    def login(self, *, email: str, password: str, ip: str) -> OpenedSession:
        now = self._clock.now()
        self._ensure_not_rate_limited(email=email, ip=ip, now=now)
        user = users.get_by_email(self._db, email)
        succeeded = False
        if user is None or user.password_hash is None:
            self._hasher.verify_dummy(password)
        else:
            succeeded, updated_hash = self._hasher.verify(password, user.password_hash)
            if succeeded and updated_hash is not None:
                user.password_hash = updated_hash
        login_attempts.add(self._db, email=email, ip=ip, succeeded=succeeded, attempted_at=now)
        if user is None or not succeeded:
            self._db.commit()
            raise InvalidCredentialsError
        opened = self._open_session(user, now)
        self._db.commit()
        return opened

    def logout(self, session_id: uuid.UUID) -> None:
        sessions.delete_by_id(self._db, session_id)
        self._db.commit()

    def request_password_reset(self, email: str) -> None:
        user = users.get_by_email(self._db, email)
        if user is None:
            return
        now = self._clock.now()
        ttl_minutes = self._settings.password_reset_ttl_minutes
        token = generate_token()
        password_reset_tokens.add(
            self._db,
            user_id=user.id,
            token_hash=hash_token(token),
            created_at=now,
            expires_at=now + timedelta(minutes=ttl_minutes),
        )
        self._db.commit()
        self._email_sender.send(
            build_password_reset_email(
                sender=self._settings.smtp_from,
                recipient=user.email,
                display_name=user.display_name,
                link=password_reset_link(self._settings.frontend_base_url, token),
                ttl_minutes=ttl_minutes,
            )
        )

    def reset_password(self, *, token: str, password: str) -> None:
        now = self._clock.now()
        reset_token = password_reset_tokens.get_usable_for_update(self._db, hash_token(token), now)
        if reset_token is None:
            raise ResetTokenInvalidError
        user = users.get_by_id(self._db, reset_token.user_id)
        if user is None:
            raise ResetTokenInvalidError
        user.password_hash = self._hasher.hash(password)
        reset_token.used_at = now
        sessions.delete_all_for_user(self._db, user.id)
        self._db.commit()

    def start_google_login(
        self, google: GoogleOAuthClient, redirect: str | None
    ) -> GoogleLoginStart:
        now = self._clock.now()
        ttl = timedelta(minutes=self._settings.google_state_ttl_minutes)
        state = generate_token()
        code_verifier = generate_code_verifier()
        oauth_states.add(
            self._db,
            state_hash=hash_token(state),
            code_verifier=code_verifier,
            redirect=redirect,
            created_at=now,
            expires_at=now + ttl,
        )
        self._db.commit()
        return GoogleLoginStart(
            authorization_url=google.authorization_url(
                state=state, code_challenge=code_challenge_s256(code_verifier)
            ),
            state=state,
            max_age_seconds=int(ttl.total_seconds()),
        )

    def complete_google_login(
        self,
        google: GoogleOAuthClient,
        *,
        state: str | None,
        state_cookie: str | None,
        code: str | None,
        error: str | None,
    ) -> GoogleLoginResult:
        if not state or not state_cookie or not secrets.compare_digest(state, state_cookie):
            raise GoogleLoginError(ErrorCode.GOOGLE_STATE_INVALID)
        now = self._clock.now()
        oauth_state = oauth_states.get_usable_for_update(self._db, hash_token(state), now)
        if oauth_state is None:
            raise GoogleLoginError(ErrorCode.GOOGLE_STATE_INVALID)
        oauth_state.used_at = now
        self._db.commit()
        if error is not None:
            if error == "access_denied":
                raise GoogleLoginError(ErrorCode.GOOGLE_CANCELLED)
            raise GoogleLoginError(ErrorCode.GOOGLE_FAILED)
        if not code:
            raise GoogleLoginError(ErrorCode.GOOGLE_FAILED)
        try:
            identity = google.exchange(code=code, code_verifier=oauth_state.code_verifier)
        except GoogleOAuthError as exc:
            raise GoogleLoginError(ErrorCode.GOOGLE_FAILED) from exc
        user = self._find_or_create_google_user(identity)
        opened = self._open_session(user, now)
        self._db.commit()
        return GoogleLoginResult(opened=opened, redirect=oauth_state.redirect)

    def _find_or_create_google_user(self, identity: GoogleIdentity) -> User:
        user = users.get_by_google_sub(self._db, identity.sub)
        if user is not None:
            return user
        if not identity.email_verified:
            raise GoogleLoginError(ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED)
        email = identity.email.strip().lower()
        user = users.get_by_email(self._db, email)
        if user is not None:
            if user.google_sub is not None:
                raise GoogleLoginError(ErrorCode.GOOGLE_ACCOUNT_CONFLICT)
            user.google_sub = identity.sub
            return user
        try:
            user = users.add(
                self._db,
                email=email,
                google_sub=identity.sub,
                display_name=_display_name_for(identity, email),
            )
            households.add_with_owner(self._db, user.id)
        except IntegrityError as exc:
            self._db.rollback()
            raise GoogleLoginError(ErrorCode.GOOGLE_FAILED) from exc
        return user

    def describe(self, user: User) -> MeResponse:
        household = users.get_household(self._db, user.id)
        if household is None:
            raise RuntimeError(f"User {user.id} has no household")
        role: HouseholdRole = "owner" if household.owner_id == user.id else "member"
        return MeResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            household=HouseholdSummary(id=household.id, role=role),
        )

    def _open_session(self, user: User, now: datetime) -> OpenedSession:
        token = generate_token()
        ttl = timedelta(days=self._settings.session_ttl_days)
        expires_at = now + ttl
        sessions.add(
            self._db,
            user_id=user.id,
            token_hash=hash_token(token),
            created_at=now,
            expires_at=expires_at,
        )
        return OpenedSession(user=user, token=token, max_age_seconds=int(ttl.total_seconds()))

    def _ensure_not_rate_limited(self, *, email: str, ip: str, now: datetime) -> None:
        window = timedelta(minutes=self._settings.login_window_minutes)
        window_start = now - window
        last_success = login_attempts.last_success_for_email(self._db, email, window_start)
        email_since = max(window_start, last_success) if last_success else window_start
        checks = (
            (
                login_attempts.failures_for_email(self._db, email, email_since),
                self._settings.login_max_failures_per_email,
            ),
            (
                login_attempts.failures_for_ip(self._db, ip, window_start),
                self._settings.login_max_failures_per_ip,
            ),
        )
        for failures, limit in checks:
            if len(failures) >= limit:
                unblocks_at = failures[len(failures) - limit] + window
                retry_after = max(1, math.ceil((unblocks_at - now).total_seconds()))
                raise TooManyAttemptsError(retry_after)


def _display_name_for(identity: GoogleIdentity, email: str) -> str:
    name = (identity.name or "").strip() or email.split("@", 1)[0]
    return name[:DISPLAY_NAME_MAX_LENGTH]


def get_auth_service(
    db: Annotated[Session, Depends(get_db)],
    clock: Annotated[Clock, Depends(get_clock)],
    settings: Annotated[Settings, Depends(get_settings)],
    hasher: Annotated[PasswordHasher, Depends(get_password_hasher)],
    email_sender: Annotated[EmailSender, Depends(get_email_sender)],
) -> AuthService:
    return AuthService(db, clock, settings, hasher, email_sender)
