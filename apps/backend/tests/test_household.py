from datetime import timedelta
from typing import Any

import httpx2
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import SESSION_COOKIE_NAME
from app.models import Household, HouseholdInvite
from app.services.tokens import hash_token
from tests.conftest import FRONTEND_BASE_URL, FakeClock

PASSWORD = "una-password-sicura"

Headers = dict[str, str]


def register(client: TestClient, name: str, invite_token: str | None = None) -> Headers:
    body = {"email": f"{name.lower()}@example.com", "password": PASSWORD, "display_name": name}
    if invite_token is not None:
        body["invite_token"] = invite_token
    response = client.post("/auth/register", json=body)
    assert response.status_code == 201, response.text
    token = client.cookies[SESSION_COOKIE_NAME]
    client.cookies.clear()
    return {"Cookie": f"{SESSION_COOKIE_NAME}={token}"}


def create_invite(client: TestClient, owner: Headers) -> str:
    response = client.post("/household/invites", headers=owner)
    assert response.status_code == 201, response.text
    url: str = response.json()["url"]
    return url.rsplit("/", 1)[1]


def accept(client: TestClient, user: Headers, token: str) -> httpx2.Response:
    return client.post(f"/household/invites/{token}/accept", headers=user)


def me(client: TestClient, user: Headers) -> dict[str, Any]:
    response = client.get("/me", headers=user)
    assert response.status_code == 200
    body: dict[str, Any] = response.json()
    return body


def members(client: TestClient, user: Headers) -> list[tuple[str, str]]:
    response = client.get("/household", headers=user)
    assert response.status_code == 200
    return [(member["display_name"], member["role"]) for member in response.json()["members"]]


def make_household(client: TestClient) -> tuple[Headers, Headers]:
    owner = register(client, "Anna")
    member = register(client, "Bruno")
    assert accept(client, member, create_invite(client, owner)).status_code == 200
    return owner, member


def test_owner_creates_invite_valid_seven_days(
    client: TestClient, clock: FakeClock, db_session: Session
) -> None:
    owner = register(client, "Anna")

    response = client.post("/household/invites", headers=owner)

    assert response.status_code == 201
    body = response.json()
    assert body["url"].startswith(f"{FRONTEND_BASE_URL}/invite/")
    invite = db_session.scalars(select(HouseholdInvite)).one()
    assert invite.expires_at == clock.now() + timedelta(days=7)
    token = body["url"].rsplit("/", 1)[1]
    assert invite.token_hash == hash_token(token)
    stored_values = [str(getattr(invite, column.key)) for column in HouseholdInvite.__table__.c]
    assert all(token not in value for value in stored_values)


def test_member_cannot_create_invite(client: TestClient) -> None:
    _, member = make_household(client)

    response = client.post("/household/invites", headers=member)

    assert response.status_code == 403
    assert response.json()["code"] == "NOT_HOUSEHOLD_OWNER"


def test_invite_preview_shows_inviter_without_login(client: TestClient) -> None:
    owner = register(client, "Anna")
    token = create_invite(client, owner)

    response = client.get(f"/household/invites/{token}")

    assert response.status_code == 200
    assert response.json()["inviter_display_name"] == "Anna"
    assert response.json()["household_id"] == me(client, owner)["household"]["id"]


def test_unknown_invite_is_not_found(client: TestClient) -> None:
    response = client.get("/household/invites/inventato")

    assert response.status_code == 404
    assert response.json()["code"] == "INVITE_NOT_FOUND"


def test_registering_with_invite_joins_household_directly(
    client: TestClient, db_session: Session
) -> None:
    owner = register(client, "Anna")
    token = create_invite(client, owner)

    bruno = register(client, "Bruno", invite_token=token)

    assert me(client, bruno)["household"] == {
        "id": me(client, owner)["household"]["id"],
        "role": "member",
    }
    assert len(db_session.scalars(select(Household)).all()) == 1
    assert members(client, owner) == [("Anna", "owner"), ("Bruno", "member")]


def test_registering_with_used_invite_creates_no_account(client: TestClient) -> None:
    owner = register(client, "Anna")
    token = create_invite(client, owner)
    register(client, "Bruno", invite_token=token)

    response = client.post(
        "/auth/register",
        json={
            "email": "carla@example.com",
            "password": PASSWORD,
            "display_name": "Carla",
            "invite_token": token,
        },
    )

    assert response.status_code == 410
    assert response.json()["code"] == "INVITE_USED"
    login = client.post("/auth/login", json={"email": "carla@example.com", "password": PASSWORD})
    assert login.status_code == 401


def test_existing_user_alone_accepts_and_old_household_is_deleted(
    client: TestClient, db_session: Session
) -> None:
    owner = register(client, "Anna")
    bruno = register(client, "Bruno")
    old_household_id = me(client, bruno)["household"]["id"]

    response = accept(client, bruno, create_invite(client, owner))

    assert response.status_code == 200
    assert response.json()["household"]["role"] == "member"
    assert response.json()["household"]["id"] == me(client, owner)["household"]["id"]
    assert db_session.get(Household, old_household_id) is None
    assert members(client, bruno) == [("Anna", "owner"), ("Bruno", "member")]


def test_invite_can_be_used_only_once(client: TestClient) -> None:
    owner = register(client, "Anna")
    token = create_invite(client, owner)
    accept(client, register(client, "Bruno"), token)

    response = accept(client, register(client, "Carla"), token)

    assert response.status_code == 410
    assert response.json()["code"] == "INVITE_USED"
    assert client.get(f"/household/invites/{token}").json()["code"] == "INVITE_USED"


def test_invite_expires_after_seven_days(client: TestClient, clock: FakeClock) -> None:
    owner = register(client, "Anna")
    token = create_invite(client, owner)
    bruno = register(client, "Bruno")

    clock.advance(timedelta(days=7, seconds=1))

    preview = client.get(f"/household/invites/{token}")
    assert preview.status_code == 410
    assert preview.json()["code"] == "INVITE_EXPIRED"
    response = accept(client, bruno, token)
    assert response.status_code == 410
    assert response.json()["code"] == "INVITE_EXPIRED"


def test_invite_is_still_valid_just_before_seven_days(client: TestClient, clock: FakeClock) -> None:
    owner = register(client, "Anna")
    token = create_invite(client, owner)
    bruno = register(client, "Bruno")

    clock.advance(timedelta(days=7, seconds=-1))

    assert accept(client, bruno, token).status_code == 200


def test_member_of_another_household_with_others_must_leave_first(client: TestClient) -> None:
    _, bruno = make_household(client)
    carla = register(client, "Carla")
    token = create_invite(client, carla)

    response = accept(client, bruno, token)

    assert response.status_code == 409
    assert response.json()["code"] == "MUST_LEAVE_HOUSEHOLD"
    assert client.get(f"/household/invites/{token}").status_code == 200
    assert members(client, bruno) == [("Anna", "owner"), ("Bruno", "member")]


def test_owner_with_members_must_leave_before_joining_another(client: TestClient) -> None:
    anna, _ = make_household(client)
    carla = register(client, "Carla")

    response = accept(client, anna, create_invite(client, carla))

    assert response.status_code == 409
    assert response.json()["code"] == "MUST_LEAVE_HOUSEHOLD"


def test_member_cannot_accept_invite_to_own_household(client: TestClient) -> None:
    anna, bruno = make_household(client)
    token = create_invite(client, anna)

    response = accept(client, bruno, token)

    assert response.status_code == 409
    assert response.json()["code"] == "ALREADY_IN_HOUSEHOLD"
    assert client.get(f"/household/invites/{token}").status_code == 200


def test_accepting_requires_login(client: TestClient) -> None:
    token = create_invite(client, register(client, "Anna"))

    assert client.post(f"/household/invites/{token}/accept").status_code == 401


def test_household_lists_members_with_roles_only_to_its_members(client: TestClient) -> None:
    anna, bruno = make_household(client)
    carla = register(client, "Carla")

    assert members(client, anna) == [("Anna", "owner"), ("Bruno", "member")]
    assert members(client, bruno) == [("Anna", "owner"), ("Bruno", "member")]
    assert members(client, carla) == [("Carla", "owner")]
    household = client.get("/household", headers=bruno).json()
    assert household["role"] == "member"
    assert all("email" not in member for member in household["members"])


def test_household_requires_login(client: TestClient) -> None:
    response = client.get("/household")

    assert response.status_code == 401


def test_owner_removes_member_who_gets_new_empty_household(client: TestClient) -> None:
    anna, bruno = make_household(client)
    bruno_id = me(client, bruno)["id"]
    anna_household_id = me(client, anna)["household"]["id"]

    response = client.delete(f"/household/members/{bruno_id}", headers=anna)

    assert response.status_code == 204
    assert members(client, anna) == [("Anna", "owner")]
    bruno_household = me(client, bruno)["household"]
    assert bruno_household["role"] == "owner"
    assert bruno_household["id"] != anna_household_id
    assert members(client, bruno) == [("Bruno", "owner")]


def test_member_cannot_remove_others(client: TestClient) -> None:
    anna, bruno = make_household(client)

    response = client.delete(f"/household/members/{me(client, anna)['id']}", headers=bruno)

    assert response.status_code == 403
    assert response.json()["code"] == "NOT_HOUSEHOLD_OWNER"


def test_owner_cannot_remove_herself(client: TestClient) -> None:
    anna, _ = make_household(client)

    response = client.delete(f"/household/members/{me(client, anna)['id']}", headers=anna)

    assert response.status_code == 400
    assert response.json()["code"] == "CANNOT_REMOVE_SELF"


def test_owner_cannot_remove_someone_from_another_household(client: TestClient) -> None:
    anna, _ = make_household(client)
    carla = register(client, "Carla")

    response = client.delete(f"/household/members/{me(client, carla)['id']}", headers=anna)

    assert response.status_code == 404
    assert response.json()["code"] == "MEMBER_NOT_FOUND"
    assert members(client, carla) == [("Carla", "owner")]


def test_member_leaves_and_gets_new_empty_household(client: TestClient) -> None:
    anna, bruno = make_household(client)

    response = client.post("/household/leave", headers=bruno)

    assert response.status_code == 200
    assert response.json()["household"]["role"] == "owner"
    assert members(client, bruno) == [("Bruno", "owner")]
    assert members(client, anna) == [("Anna", "owner")]


def test_owner_cannot_leave_while_others_are_members(client: TestClient) -> None:
    anna, _ = make_household(client)

    response = client.post("/household/leave", headers=anna)

    assert response.status_code == 409
    assert response.json()["code"] == "OWNER_CANNOT_LEAVE"
    assert members(client, anna) == [("Anna", "owner"), ("Bruno", "member")]


def test_member_who_left_can_join_another_household(client: TestClient) -> None:
    _, bruno = make_household(client)
    carla = register(client, "Carla")
    token = create_invite(client, carla)
    assert accept(client, bruno, token).status_code == 409

    client.post("/household/leave", headers=bruno)

    assert accept(client, bruno, token).status_code == 200
    assert members(client, carla) == [("Carla", "owner"), ("Bruno", "member")]
