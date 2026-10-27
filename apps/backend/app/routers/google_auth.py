from typing import Annotated
from urllib.parse import quote, urlencode

from fastapi import APIRouter, Cookie, Depends, Query, status
from fastapi.responses import RedirectResponse

from app.core.config import Settings, get_settings
from app.core.errors import GoogleLoginError
from app.core.redirects import sanitize_redirect
from app.core.security import (
    INVITE_COOKIE_NAME,
    OAUTH_STATE_COOKIE_NAME,
    clear_invite_cookie,
    clear_oauth_state_cookie,
    set_invite_cookie,
    set_oauth_state_cookie,
    set_session_cookie,
)
from app.schemas.errors import ErrorCode
from app.services.auth_service import AuthService, GoogleLoginResult, get_auth_service
from app.services.google_oauth import GoogleOAuthClient, get_google_client
from app.services.household_service import INVITE_TOKEN_MAX_LENGTH

router = APIRouter(prefix="/auth/google", tags=["auth"])

Service = Annotated[AuthService, Depends(get_auth_service)]
Google = Annotated[GoogleOAuthClient | None, Depends(get_google_client)]
AppSettings = Annotated[Settings, Depends(get_settings)]

REDIRECT_RESPONSES: dict[int | str, dict[str, str]] = {
    status.HTTP_302_FOUND: {"description": "Redirect"}
}


def _frontend_url(settings: Settings, path: str) -> str:
    return f"{settings.frontend_base_url.rstrip('/')}{path}"


def _login_error_redirect(settings: Settings, code: ErrorCode) -> RedirectResponse:
    query = urlencode({"error": code.value})
    response = RedirectResponse(
        _frontend_url(settings, f"/login?{query}"), status_code=status.HTTP_302_FOUND
    )
    clear_oauth_state_cookie(response)
    clear_invite_cookie(response)
    return response


def _success_path(result: GoogleLoginResult, invite_token: str | None) -> str:
    if invite_token is None:
        return result.redirect or "/"
    if result.joined_household:
        return "/household"
    return f"/invite/{quote(invite_token, safe='')}"


@router.get(
    "/authorize",
    response_class=RedirectResponse,
    status_code=status.HTTP_302_FOUND,
    responses=REDIRECT_RESPONSES,
    operation_id="googleAuthorize",
)
def google_authorize(
    service: Service,
    google: Google,
    settings: AppSettings,
    redirect: Annotated[str | None, Query(max_length=2048)] = None,
    invite_token: Annotated[str | None, Query(max_length=INVITE_TOKEN_MAX_LENGTH)] = None,
) -> RedirectResponse:
    if google is None:
        return _login_error_redirect(settings, ErrorCode.GOOGLE_UNAVAILABLE)
    start = service.start_google_login(google, sanitize_redirect(redirect))
    response = RedirectResponse(start.authorization_url, status_code=status.HTTP_302_FOUND)
    set_oauth_state_cookie(response, start.state, start.max_age_seconds)
    if invite_token:
        set_invite_cookie(response, invite_token, start.max_age_seconds)
    else:
        clear_invite_cookie(response)
    return response


@router.get(
    "/callback",
    response_class=RedirectResponse,
    status_code=status.HTTP_302_FOUND,
    responses=REDIRECT_RESPONSES,
    operation_id="googleCallback",
)
def google_callback(
    service: Service,
    google: Google,
    settings: AppSettings,
    state: Annotated[str | None, Query(max_length=200)] = None,
    code: Annotated[str | None, Query(max_length=2048)] = None,
    error: Annotated[str | None, Query(max_length=200)] = None,
    state_cookie: Annotated[str | None, Cookie(alias=OAUTH_STATE_COOKIE_NAME)] = None,
    invite_cookie: Annotated[
        str | None, Cookie(alias=INVITE_COOKIE_NAME, max_length=INVITE_TOKEN_MAX_LENGTH)
    ] = None,
) -> RedirectResponse:
    if google is None:
        return _login_error_redirect(settings, ErrorCode.GOOGLE_UNAVAILABLE)
    try:
        result = service.complete_google_login(
            google,
            state=state,
            state_cookie=state_cookie,
            code=code,
            error=error,
            invite_token=invite_cookie or None,
        )
    except GoogleLoginError as exc:
        return _login_error_redirect(settings, exc.code)
    response = RedirectResponse(
        _frontend_url(settings, _success_path(result, invite_cookie or None)),
        status_code=status.HTTP_302_FOUND,
    )
    set_session_cookie(response, result.opened.token, result.opened.max_age_seconds)
    clear_oauth_state_cookie(response)
    clear_invite_cookie(response)
    return response
