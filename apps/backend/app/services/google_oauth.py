from dataclasses import dataclass
from typing import Annotated, Protocol
from urllib.parse import urlencode

import httpx2
from fastapi import Depends
from pydantic import BaseModel, ValidationError

from app.core.config import Settings, get_settings

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


@dataclass(frozen=True)
class GoogleIdentity:
    sub: str
    email: str
    email_verified: bool
    name: str | None


class GoogleOAuthError(Exception):
    pass


class GoogleOAuthClient(Protocol):
    def authorization_url(self, *, state: str, code_challenge: str) -> str: ...

    def exchange(self, *, code: str, code_verifier: str) -> GoogleIdentity: ...


class _TokenResponse(BaseModel):
    access_token: str


class _UserInfo(BaseModel):
    sub: str
    email: str
    email_verified: bool = False
    name: str | None = None


class HttpGoogleOAuthClient:
    def __init__(
        self,
        *,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        transport: httpx2.BaseTransport | None = None,
    ) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._redirect_uri = redirect_uri
        self._transport = transport

    def authorization_url(self, *, state: str, code_challenge: str) -> str:
        query = urlencode(
            {
                "response_type": "code",
                "client_id": self._client_id,
                "redirect_uri": self._redirect_uri,
                "scope": "openid email profile",
                "state": state,
                "code_challenge": code_challenge,
                "code_challenge_method": "S256",
                "prompt": "select_account",
            }
        )
        return f"{GOOGLE_AUTHORIZE_URL}?{query}"

    def exchange(self, *, code: str, code_verifier: str) -> GoogleIdentity:
        try:
            with httpx2.Client(transport=self._transport, timeout=10) as http:
                token_response = http.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "grant_type": "authorization_code",
                        "code": code,
                        "code_verifier": code_verifier,
                        "client_id": self._client_id,
                        "client_secret": self._client_secret,
                        "redirect_uri": self._redirect_uri,
                    },
                )
                token_response.raise_for_status()
                token = _TokenResponse.model_validate_json(token_response.content)
                userinfo_response = http.get(
                    GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {token.access_token}"},
                )
                userinfo_response.raise_for_status()
                userinfo = _UserInfo.model_validate_json(userinfo_response.content)
        except (httpx2.HTTPError, ValidationError) as exc:
            raise GoogleOAuthError from exc
        return GoogleIdentity(
            sub=userinfo.sub,
            email=userinfo.email,
            email_verified=userinfo.email_verified,
            name=userinfo.name,
        )


def get_google_client(
    settings: Annotated[Settings, Depends(get_settings)],
) -> GoogleOAuthClient | None:
    if (
        not settings.google_client_id
        or settings.google_client_secret is None
        or not settings.google_client_secret.get_secret_value()
        or not settings.google_redirect_uri
    ):
        return None
    return HttpGoogleOAuthClient(
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret.get_secret_value(),
        redirect_uri=settings.google_redirect_uri,
    )
