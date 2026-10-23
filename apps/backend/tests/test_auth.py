import re
from datetime import timedelta

import httpx2
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import SESSION_COOKIE_NAME
from app.models import Household, HouseholdMember, User
from tests.conftest import FRONTEND_BASE_URL, FakeClock, Outbox

PASSWORD = "una-password-sicura"
NEW_PASSWORD = "una-nuova-password"


def register(
    client: TestClient, email: str = "anna@example.com", password: str = PASSWORD
) -> httpx2.Response:
    return client.post(
        "/auth/register",
        json={"email": email, "password": password, "display_name": "Anna"},
    )


def login(
    client: TestClient, email: str = "anna@example.com", password: str = PASSWORD
) -> httpx2.Response:
    return client.post("/auth/login", json={"email": email, "password": password})


def reset_token_from(outbox: Outbox) -> str:
    body = outbox.messages[-1].get_content()
    match = re.search(r"/reset-password\?token=([\w-]+)", body)
    assert match is not None
    return match.group(1)


def session_cookie(token: str) -> dict[str, str]:
    return {"Cookie": f"{SESSION_COOKIE_NAME}={token}"}


def test_register_creates_user_and_owned_household(client: TestClient, db_session: Session) -> None:
    response = register(client)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "anna@example.com"
    assert body["household"]["role"] == "owner"
    user = db_session.scalars(select(User).where(User.email == "anna@example.com")).one()
    household = db_session.get(Household, body["household"]["id"])
    assert household is not None
    assert household.owner_id == user.id
    member = db_session.scalars(
        select(HouseholdMember).where(HouseholdMember.user_id == user.id)
    ).one()
    assert member.household_id == household.id
    assert user.password_hash is not None
    assert PASSWORD not in user.password_hash


def test_register_opens_a_session(client: TestClient) -> None:
    register(client)

    assert client.get("/me").status_code == 200


def test_register_rejects_duplicate_email_ignoring_case(client: TestClient) -> None:
    register(client)

    response = register(client, email="Anna@Example.com")

    assert response.status_code == 409
    assert response.json()["code"] == "EMAIL_ALREADY_REGISTERED"


def test_register_rejects_short_password(client: TestClient) -> None:
    response = register(client, password="corta")

    assert response.status_code == 422


def test_login_sets_http_only_secure_lax_cookie(client: TestClient) -> None:
    register(client)
    client.cookies.clear()

    response = login(client)

    assert response.status_code == 200
    set_cookie = response.headers["set-cookie"]
    assert set_cookie.startswith(f"{SESSION_COOKIE_NAME}=")
    assert "HttpOnly" in set_cookie
    assert "Secure" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert "Path=/" in set_cookie
    assert f"Max-Age={30 * 24 * 60 * 60}" in set_cookie


def test_login_session_gives_access_to_me(client: TestClient) -> None:
    register(client)
    client.cookies.clear()
    login(client)

    response = client.get("/me")

    assert response.status_code == 200
    assert response.json()["display_name"] == "Anna"


def test_me_without_session_is_unauthenticated(client: TestClient) -> None:
    response = client.get("/me")

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHENTICATED"


def test_login_failure_does_not_reveal_whether_email_exists(client: TestClient) -> None:
    register(client)
    client.cookies.clear()

    wrong_password = login(client, password="password-sbagliata")
    unknown_email = login(client, email="nessuno@example.com")

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()
    assert wrong_password.json()["code"] == "INVALID_CREDENTIALS"


def test_login_is_blocked_after_too_many_failures_for_email(
    client: TestClient, clock: FakeClock
) -> None:
    register(client)
    client.cookies.clear()
    for _ in range(5):
        assert login(client, password="password-sbagliata").status_code == 401

    blocked = login(client)

    assert blocked.status_code == 429
    assert blocked.json()["code"] == "TOO_MANY_ATTEMPTS"
    assert 0 < int(blocked.headers["retry-after"]) <= 15 * 60

    clock.advance(timedelta(minutes=15, seconds=1))

    assert login(client).status_code == 200


def test_successful_login_resets_failures_for_email(client: TestClient) -> None:
    register(client)
    client.cookies.clear()
    for _ in range(4):
        login(client, password="password-sbagliata")
    assert login(client).status_code == 200
    for _ in range(4):
        login(client, password="password-sbagliata")

    assert login(client).status_code == 200


def test_login_is_blocked_after_too_many_failures_from_same_ip(client: TestClient) -> None:
    for index in range(5):
        for _ in range(4):
            login(client, email=f"utente{index}@example.com", password="password-sbagliata")

    response = login(client, email="altro@example.com", password="password-sbagliata")

    assert response.status_code == 429


def test_forgot_password_sends_single_use_link(client: TestClient, outbox: Outbox) -> None:
    register(client)

    response = client.post("/auth/forgot-password", json={"email": "anna@example.com"})

    assert response.status_code == 202
    assert len(outbox.messages) == 1
    message = outbox.messages[0]
    assert message["To"] == "anna@example.com"
    assert f"{FRONTEND_BASE_URL}/reset-password?token=" in message.get_content()


def test_forgot_password_for_unknown_email_looks_the_same(
    client: TestClient, outbox: Outbox
) -> None:
    response = client.post("/auth/forgot-password", json={"email": "nessuno@example.com"})

    assert response.status_code == 202
    assert outbox.messages == []


def test_reset_password_sets_new_password(client: TestClient, outbox: Outbox) -> None:
    register(client)
    client.post("/auth/forgot-password", json={"email": "anna@example.com"})
    client.cookies.clear()

    response = client.post(
        "/auth/reset-password",
        json={"token": reset_token_from(outbox), "password": NEW_PASSWORD},
    )

    assert response.status_code == 204
    assert login(client).status_code == 401
    assert login(client, password=NEW_PASSWORD).status_code == 200


def test_reset_link_is_valid_for_one_hour(
    client: TestClient, outbox: Outbox, clock: FakeClock
) -> None:
    register(client)
    client.post("/auth/forgot-password", json={"email": "anna@example.com"})
    token = reset_token_from(outbox)

    clock.advance(timedelta(minutes=59))
    still_valid = client.post(
        "/auth/reset-password", json={"token": token, "password": NEW_PASSWORD}
    )
    assert still_valid.status_code == 204

    client.post("/auth/forgot-password", json={"email": "anna@example.com"})
    expired_token = reset_token_from(outbox)
    clock.advance(timedelta(minutes=60, seconds=1))
    expired = client.post(
        "/auth/reset-password", json={"token": expired_token, "password": NEW_PASSWORD}
    )

    assert expired.status_code == 400
    assert expired.json()["code"] == "RESET_TOKEN_INVALID"


def test_reset_link_cannot_be_used_twice(client: TestClient, outbox: Outbox) -> None:
    register(client)
    client.post("/auth/forgot-password", json={"email": "anna@example.com"})
    token = reset_token_from(outbox)
    client.post("/auth/reset-password", json={"token": token, "password": NEW_PASSWORD})

    second = client.post(
        "/auth/reset-password", json={"token": token, "password": "altra-password-ok"}
    )

    assert second.status_code == 400
    assert second.json()["code"] == "RESET_TOKEN_INVALID"


def test_reset_password_invalidates_existing_sessions(client: TestClient, outbox: Outbox) -> None:
    register(client)
    old_token = client.cookies[SESSION_COOKIE_NAME]
    client.post("/auth/forgot-password", json={"email": "anna@example.com"})

    client.post(
        "/auth/reset-password",
        json={"token": reset_token_from(outbox), "password": NEW_PASSWORD},
    )

    client.cookies.clear()
    assert client.get("/me", headers=session_cookie(old_token)).status_code == 401


def test_logout_invalidates_session_on_server(client: TestClient) -> None:
    register(client)
    token = client.cookies[SESSION_COOKIE_NAME]

    response = client.post("/auth/logout")

    assert response.status_code == 204
    assert f'{SESSION_COOKIE_NAME}=""' in response.headers["set-cookie"]
    client.cookies.clear()
    assert client.get("/me", headers=session_cookie(token)).status_code == 401


def test_logout_without_session_is_unauthenticated(client: TestClient) -> None:
    assert client.post("/auth/logout").status_code == 401


def test_session_expires_after_thirty_days(client: TestClient, clock: FakeClock) -> None:
    register(client)

    clock.advance(timedelta(days=30, seconds=1))

    assert client.get("/me").status_code == 401
