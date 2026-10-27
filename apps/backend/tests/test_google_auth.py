import json
from datetime import timedelta
from urllib.parse import parse_qs, urlencode, urlsplit

import httpx2
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import INVITE_COOKIE_NAME, OAUTH_STATE_COOKIE_NAME, SESSION_COOKIE_NAME
from app.main import app
from app.models import Household, HouseholdMember, OAuthState, User
from app.services.google_oauth import (
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
    GoogleIdentity,
    GoogleOAuthError,
    HttpGoogleOAuthClient,
    get_google_client,
)
from app.services.pkce import code_challenge_s256
from tests.conftest import FRONTEND_BASE_URL, FakeClock, Outbox
from tests.test_auth import reset_token_from

FAKE_AUTHORIZE_URL = "https://accounts.google.test/auth"
PASSWORD = "una-password-sicura"


class FakeGoogleClient:
    def __init__(self) -> None:
        self.identity = GoogleIdentity(
            sub="google-sub-1", email="anna@example.com", email_verified=True, name="Anna Rossi"
        )
        self.fail = False
        self.exchanges: list[tuple[str, str]] = []
        self.challenges: list[str] = []

    def authorization_url(self, *, state: str, code_challenge: str) -> str:
        self.challenges.append(code_challenge)
        return f"{FAKE_AUTHORIZE_URL}?{urlencode({'state': state})}"

    def exchange(self, *, code: str, code_verifier: str) -> GoogleIdentity:
        self.exchanges.append((code, code_verifier))
        if self.fail:
            raise GoogleOAuthError
        return self.identity


@pytest.fixture
def google(client: TestClient) -> FakeGoogleClient:
    fake = FakeGoogleClient()
    app.dependency_overrides[get_google_client] = lambda: fake
    return fake


def start(client: TestClient, redirect: str | None = None) -> str:
    params = {} if redirect is None else {"redirect": redirect}
    response = client.get("/auth/google/authorize", params=params, follow_redirects=False)
    assert response.status_code == 302
    return parse_qs(urlsplit(response.headers["location"]).query)["state"][0]


def callback(client: TestClient, **params: str) -> httpx2.Response:
    return client.get("/auth/google/callback", params=params, follow_redirects=False)


def login_error(response: httpx2.Response) -> str | None:
    location = urlsplit(response.headers["location"])
    assert f"{location.scheme}://{location.netloc}" == FRONTEND_BASE_URL
    assert location.path == "/login"
    return parse_qs(location.query)["error"][0]


def register_with_password(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={"email": "anna@example.com", "password": PASSWORD, "display_name": "Anna"},
    )
    client.cookies.clear()


def test_authorize_redirects_to_google_with_state_and_pkce(
    client: TestClient, google: FakeGoogleClient
) -> None:
    response = client.get("/auth/google/authorize", follow_redirects=False)

    assert response.status_code == 302
    assert response.headers["location"].startswith(FAKE_AUTHORIZE_URL)
    set_cookie = response.headers["set-cookie"]
    assert set_cookie.startswith(f"{OAUTH_STATE_COOKIE_NAME}=")
    assert "HttpOnly" in set_cookie
    assert "Secure" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert len(google.challenges) == 1


def test_new_user_gets_account_with_google_sub_and_own_household(
    client: TestClient, google: FakeGoogleClient, db_session: Session
) -> None:
    state = start(client, redirect="/ricette?q=pasta")

    response = callback(client, state=state, code="auth-code")

    assert response.status_code == 302
    assert response.headers["location"] == f"{FRONTEND_BASE_URL}/ricette?q=pasta"
    assert f"{SESSION_COOKIE_NAME}=" in response.headers["set-cookie"]
    user = db_session.scalars(select(User).where(User.email == "anna@example.com")).one()
    assert user.google_sub == "google-sub-1"
    assert user.password_hash is None
    assert user.display_name == "Anna Rossi"
    household = db_session.scalars(select(Household).where(Household.owner_id == user.id)).one()
    member = db_session.scalars(
        select(HouseholdMember).where(HouseholdMember.user_id == user.id)
    ).one()
    assert member.household_id == household.id
    me = client.get("/me")
    assert me.status_code == 200
    assert me.json()["household"]["role"] == "owner"


def test_pkce_verifier_matches_the_challenge_sent_to_google(
    client: TestClient, google: FakeGoogleClient
) -> None:
    state = start(client)

    callback(client, state=state, code="auth-code")

    code, verifier = google.exchanges[0]
    assert code == "auth-code"
    assert code_challenge_s256(verifier) == google.challenges[0]


def test_returning_google_user_signs_in_to_the_same_account(
    client: TestClient, google: FakeGoogleClient, db_session: Session
) -> None:
    callback(client, state=start(client), code="first")
    client.cookies.clear()

    response = callback(client, state=start(client), code="second")

    assert response.headers["location"] == f"{FRONTEND_BASE_URL}/"
    users = db_session.scalars(select(User).where(User.email == "anna@example.com")).all()
    assert len(users) == 1


def test_verified_email_links_google_to_existing_account(
    client: TestClient, google: FakeGoogleClient, db_session: Session
) -> None:
    register_with_password(client)

    response = callback(client, state=start(client), code="auth-code")

    assert response.headers["location"] == f"{FRONTEND_BASE_URL}/"
    user = db_session.scalars(select(User).where(User.email == "anna@example.com")).one()
    assert user.google_sub == "google-sub-1"
    assert user.display_name == "Anna"
    client.cookies.clear()
    login = client.post("/auth/login", json={"email": "anna@example.com", "password": PASSWORD})
    assert login.status_code == 200


def test_google_email_matching_is_case_insensitive(
    client: TestClient, google: FakeGoogleClient, db_session: Session
) -> None:
    register_with_password(client)
    google.identity = GoogleIdentity(
        sub="google-sub-1", email="Anna@Example.com", email_verified=True, name=None
    )

    callback(client, state=start(client), code="auth-code")

    users = db_session.scalars(select(User)).all()
    assert [user.google_sub for user in users] == ["google-sub-1"]


def test_unverified_email_is_not_linked_to_existing_account(
    client: TestClient, google: FakeGoogleClient, db_session: Session
) -> None:
    register_with_password(client)
    google.identity = GoogleIdentity(
        sub="google-sub-1", email="anna@example.com", email_verified=False, name=None
    )

    response = callback(client, state=start(client), code="auth-code")

    assert login_error(response) == "GOOGLE_EMAIL_NOT_VERIFIED"
    assert SESSION_COOKIE_NAME not in response.headers.get("set-cookie", "")
    user = db_session.scalars(select(User).where(User.email == "anna@example.com")).one()
    assert user.google_sub is None


def test_unverified_email_does_not_create_an_account(
    client: TestClient, google: FakeGoogleClient, db_session: Session
) -> None:
    google.identity = GoogleIdentity(
        sub="google-sub-1", email="anna@example.com", email_verified=False, name=None
    )

    response = callback(client, state=start(client), code="auth-code")

    assert login_error(response) == "GOOGLE_EMAIL_NOT_VERIFIED"
    assert db_session.scalars(select(User)).all() == []


def test_email_linked_to_another_google_account_is_refused(
    client: TestClient, google: FakeGoogleClient
) -> None:
    callback(client, state=start(client), code="first")
    client.cookies.clear()
    google.identity = GoogleIdentity(
        sub="google-sub-2", email="anna@example.com", email_verified=True, name=None
    )

    response = callback(client, state=start(client), code="second")

    assert login_error(response) == "GOOGLE_ACCOUNT_CONFLICT"


def test_state_mismatch_with_cookie_is_rejected(
    client: TestClient, google: FakeGoogleClient
) -> None:
    start(client)
    other_state = start(client)
    client.cookies.clear()
    client.cookies.set(OAUTH_STATE_COOKIE_NAME, "valore-diverso", domain="testserver")

    response = callback(client, state=other_state, code="auth-code")

    assert login_error(response) == "GOOGLE_STATE_INVALID"
    assert google.exchanges == []


def test_missing_state_cookie_is_rejected(client: TestClient, google: FakeGoogleClient) -> None:
    state = start(client)
    client.cookies.clear()

    response = callback(client, state=state, code="auth-code")

    assert login_error(response) == "GOOGLE_STATE_INVALID"
    assert google.exchanges == []


def test_unknown_state_is_rejected(client: TestClient, google: FakeGoogleClient) -> None:
    client.cookies.set(OAUTH_STATE_COOKIE_NAME, "inventato", domain="testserver")

    response = callback(client, state="inventato", code="auth-code")

    assert login_error(response) == "GOOGLE_STATE_INVALID"


def test_expired_state_is_rejected(
    client: TestClient, google: FakeGoogleClient, clock: FakeClock
) -> None:
    state = start(client)
    clock.advance(timedelta(minutes=10, seconds=1))

    response = callback(client, state=state, code="auth-code")

    assert login_error(response) == "GOOGLE_STATE_INVALID"
    assert google.exchanges == []


def test_state_cannot_be_reused(client: TestClient, google: FakeGoogleClient) -> None:
    state = start(client)
    callback(client, state=state, code="auth-code")
    client.cookies.set(OAUTH_STATE_COOKIE_NAME, state, domain="testserver")

    response = callback(client, state=state, code="auth-code")

    assert login_error(response) == "GOOGLE_STATE_INVALID"
    assert len(google.exchanges) == 1


def test_cancelled_on_google_redirects_with_error(
    client: TestClient, google: FakeGoogleClient
) -> None:
    response = callback(client, state=start(client), error="access_denied")

    assert login_error(response) == "GOOGLE_CANCELLED"
    assert google.exchanges == []


def test_google_failure_redirects_with_error(client: TestClient, google: FakeGoogleClient) -> None:
    google.fail = True

    response = callback(client, state=start(client), code="auth-code")

    assert login_error(response) == "GOOGLE_FAILED"


def test_unsafe_redirect_is_ignored(client: TestClient, google: FakeGoogleClient) -> None:
    state = start(client, redirect="//evil.example")

    response = callback(client, state=state, code="auth-code")

    assert response.headers["location"] == f"{FRONTEND_BASE_URL}/"


def test_google_unavailable_without_credentials(client: TestClient) -> None:
    app.dependency_overrides[get_google_client] = lambda: None

    response = client.get("/auth/google/authorize", follow_redirects=False)

    assert login_error(response) == "GOOGLE_UNAVAILABLE"


def test_google_only_user_has_no_password_but_can_set_one(
    client: TestClient, google: FakeGoogleClient, outbox: Outbox
) -> None:
    callback(client, state=start(client), code="auth-code")
    client.cookies.clear()

    password_login = client.post(
        "/auth/login", json={"email": "anna@example.com", "password": PASSWORD}
    )
    assert password_login.status_code == 401
    assert password_login.json()["code"] == "INVALID_CREDENTIALS"

    client.post("/auth/forgot-password", json={"email": "anna@example.com"})
    token = reset_token_from(outbox)
    reset = client.post("/auth/reset-password", json={"token": token, "password": PASSWORD})
    assert reset.status_code == 204

    login = client.post("/auth/login", json={"email": "anna@example.com", "password": PASSWORD})
    assert login.status_code == 200


def test_http_client_exchanges_code_with_pkce_and_reads_userinfo() -> None:
    requests: list[httpx2.Request] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        requests.append(request)
        if str(request.url) == GOOGLE_TOKEN_URL:
            return httpx2.Response(200, json={"access_token": "access", "token_type": "Bearer"})
        if str(request.url) == GOOGLE_USERINFO_URL:
            return httpx2.Response(
                200,
                json={
                    "sub": "google-sub-1",
                    "email": "anna@example.com",
                    "email_verified": True,
                    "name": "Anna Rossi",
                },
            )
        return httpx2.Response(404)

    client = HttpGoogleOAuthClient(
        client_id="client-id",
        client_secret="client-secret",
        redirect_uri="https://bis.test/api/auth/google/callback",
        transport=httpx2.MockTransport(handler),
    )

    identity = client.exchange(code="auth-code", code_verifier="verifier")

    assert identity == GoogleIdentity(
        sub="google-sub-1", email="anna@example.com", email_verified=True, name="Anna Rossi"
    )
    token_form = parse_qs(requests[0].content.decode())
    assert token_form["code"] == ["auth-code"]
    assert token_form["code_verifier"] == ["verifier"]
    assert token_form["grant_type"] == ["authorization_code"]
    assert token_form["redirect_uri"] == ["https://bis.test/api/auth/google/callback"]
    assert requests[1].headers["authorization"] == "Bearer access"


def test_http_client_builds_authorization_url_with_pkce() -> None:
    client = HttpGoogleOAuthClient(
        client_id="client-id", client_secret="secret", redirect_uri="https://bis.test/cb"
    )

    url = urlsplit(client.authorization_url(state="stato", code_challenge="sfida"))
    query = parse_qs(url.query)

    assert query["state"] == ["stato"]
    assert query["code_challenge"] == ["sfida"]
    assert query["code_challenge_method"] == ["S256"]
    assert query["response_type"] == ["code"]
    assert query["scope"] == ["openid email profile"]


def test_http_client_reports_google_errors() -> None:
    client = HttpGoogleOAuthClient(
        client_id="client-id",
        client_secret="secret",
        redirect_uri="https://bis.test/cb",
        transport=httpx2.MockTransport(
            lambda _: httpx2.Response(400, content=json.dumps({"error": "invalid_grant"}))
        ),
    )

    with pytest.raises(GoogleOAuthError):
        client.exchange(code="scaduto", code_verifier="verifier")


def owner_invite_token(client: TestClient) -> str:
    client.post(
        "/auth/register",
        json={"email": "owner@example.com", "password": PASSWORD, "display_name": "Owner"},
    )
    url: str = client.post("/household/invites").json()["url"]
    client.cookies.clear()
    return url.rsplit("/", 1)[1]


def start_with_invite(client: TestClient, invite_token: str) -> tuple[str, str]:
    response = client.get(
        "/auth/google/authorize", params={"invite_token": invite_token}, follow_redirects=False
    )
    state = parse_qs(urlsplit(response.headers["location"]).query)["state"][0]
    return state, response.headers.get_list("set-cookie")[-1]


def test_authorize_keeps_invite_token_in_http_only_cookie(
    client: TestClient, google: FakeGoogleClient, db_session: Session
) -> None:
    _, invite_cookie = start_with_invite(client, "token-invito")

    assert invite_cookie.startswith(f"{INVITE_COOKIE_NAME}=token-invito")
    assert "HttpOnly" in invite_cookie
    assert "Secure" in invite_cookie
    stored = db_session.scalars(select(OAuthState)).one()
    assert "token-invito" not in (stored.redirect or "")


def test_new_google_user_with_invite_joins_household_directly(
    client: TestClient, google: FakeGoogleClient, db_session: Session
) -> None:
    invite_token = owner_invite_token(client)
    state, _ = start_with_invite(client, invite_token)

    response = callback(client, state=state, code="auth-code")

    assert response.headers["location"] == f"{FRONTEND_BASE_URL}/household"
    me = client.get("/me").json()
    assert me["household"]["role"] == "member"
    anna = db_session.scalars(select(User).where(User.email == "anna@example.com")).one()
    assert db_session.scalars(select(Household).where(Household.owner_id == anna.id)).all() == []


def test_existing_user_with_invite_returns_to_invite_page_to_confirm(
    client: TestClient, google: FakeGoogleClient
) -> None:
    invite_token = owner_invite_token(client)
    register_with_password(client)
    state, _ = start_with_invite(client, invite_token)

    response = callback(client, state=state, code="auth-code")

    assert response.headers["location"] == f"{FRONTEND_BASE_URL}/invite/{invite_token}"
    assert client.get("/me").json()["household"]["role"] == "owner"
    assert client.get(f"/household/invites/{invite_token}").status_code == 200


def test_new_google_user_with_invalid_invite_gets_own_household(
    client: TestClient, google: FakeGoogleClient
) -> None:
    state, _ = start_with_invite(client, "inventato")

    response = callback(client, state=state, code="auth-code")

    assert response.headers["location"] == f"{FRONTEND_BASE_URL}/invite/inventato"
    assert client.get("/me").json()["household"]["role"] == "owner"


def test_invite_cookie_is_cleared_after_callback(
    client: TestClient, google: FakeGoogleClient
) -> None:
    state, _ = start_with_invite(client, owner_invite_token(client))

    response = callback(client, state=state, code="auth-code")

    cleared = [c for c in response.headers.get_list("set-cookie") if INVITE_COOKIE_NAME in c]
    assert cleared
    assert all('=""' in cookie for cookie in cleared)
