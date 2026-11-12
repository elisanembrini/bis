from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Photo, Recipe
from tests.conftest import FakeClock
from tests.test_household import Headers, accept, create_invite, me, register
from tests.test_photos import recipe_with_photos, upload_id
from tests.test_recipes import create, recipe_payload
from tests.test_tags import create_tag, tag_id


@pytest.fixture
def household(client: TestClient) -> dict[str, Headers]:
    anna = register(client, "Anna")
    bruno = register(client, "Bruno")
    carla = register(client, "Carla")
    for member in (bruno, carla):
        assert accept(client, member, create_invite(client, anna)).status_code == 200
    return {"anna": anna, "bruno": bruno, "carla": carla, "dario": register(client, "Dario")}


def user_id(client: TestClient, user: Headers) -> str:
    found: str = me(client, user)["id"]
    return found


def share(
    client: TestClient, owner: Headers, recipe_id: str, *recipients: Headers
) -> list[dict[str, Any]]:
    response = client.put(
        f"/recipes/{recipe_id}/shares",
        json={"user_ids": [user_id(client, recipient) for recipient in recipients]},
        headers=owner,
    )
    assert response.status_code == 200, response.text
    body: list[dict[str, Any]] = response.json()
    return body


def listed(client: TestClient, user: Headers, **params: str) -> list[dict[str, Any]]:
    response = client.get("/recipes", params=params, headers=user)
    assert response.status_code == 200, response.text
    body: list[dict[str, Any]] = response.json()
    return body


def copy_of(client: TestClient, user: Headers, recipe_id: str) -> dict[str, Any]:
    response = client.post(f"/recipes/{recipe_id}/copy", headers=user)
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


def test_shared_recipe_appears_for_chosen_members(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno, carla = household["anna"], household["bruno"], household["carla"]
    recipe = create(client, anna, title="Tiramisù")

    share(client, anna, recipe["id"], bruno)

    shared = listed(client, bruno, scope="shared")
    assert [item["title"] for item in shared] == ["Tiramisù"]
    assert shared[0]["is_own"] is False
    assert shared[0]["author"]["display_name"] == "Anna"
    assert listed(client, bruno, scope="mine") == []
    assert [item["title"] for item in listed(client, bruno)] == ["Tiramisù"]
    assert listed(client, carla) == []
    assert listed(client, anna)[0]["is_own"] is True


def test_source_link_is_visible_to_recipients_and_kept_by_the_copy(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    recipe = create(client, anna, source_url="https://example.com/tiramisu")
    share(client, anna, recipe["id"], bruno)

    seen_by_bruno = client.get(f"/recipes/{recipe['id']}", headers=bruno).json()
    copied = copy_of(client, bruno, recipe["id"])

    assert seen_by_bruno["source_url"] == "https://example.com/tiramisu"
    assert copied["source_url"] == "https://example.com/tiramisu"


def test_share_list_shows_household_members_and_state(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    recipe = create(client, anna)
    share(client, anna, recipe["id"], bruno)

    response = client.get(f"/recipes/{recipe['id']}/shares", headers=anna)

    assert response.status_code == 200
    states = {item["display_name"]: item["shared"] for item in response.json()}
    assert states == {"Bruno": True, "Carla": False}


@pytest.mark.parametrize("target", ["dario", "anna", "unknown"])
def test_cannot_share_outside_the_household(
    client: TestClient, household: dict[str, Headers], target: str
) -> None:
    anna = household["anna"]
    recipe = create(client, anna)
    target_id = (
        "00000000-0000-4000-8000-000000000000"
        if target == "unknown"
        else user_id(client, household[target])
    )

    response = client.put(
        f"/recipes/{recipe['id']}/shares", json={"user_ids": [target_id]}, headers=anna
    )

    assert response.status_code == 422
    assert response.json()["code"] == "SHARE_NOT_ALLOWED"
    assert listed(client, household["dario"]) == []


def test_revoked_share_disappears_for_the_member(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno, carla = household["anna"], household["bruno"], household["carla"]
    recipe = create(client, anna)
    share(client, anna, recipe["id"], bruno, carla)

    states = share(client, anna, recipe["id"], carla)

    assert {item["display_name"]: item["shared"] for item in states} == {
        "Bruno": False,
        "Carla": True,
    }
    assert listed(client, bruno) == []
    assert client.get(f"/recipes/{recipe['id']}", headers=bruno).status_code == 404
    assert client.get(f"/recipes/{recipe['id']}", headers=carla).status_code == 200


def test_recipient_sees_the_recipe_read_only(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    recipe = create(client, anna, title="Originale")
    share(client, anna, recipe["id"], bruno)

    detail = client.get(f"/recipes/{recipe['id']}", headers=bruno)
    update = client.put(
        f"/recipes/{recipe['id']}", json=recipe_payload(title="Modificata"), headers=bruno
    )
    delete = client.delete(f"/recipes/{recipe['id']}", headers=bruno)
    shares = client.get(f"/recipes/{recipe['id']}/shares", headers=bruno)
    reshare = client.put(f"/recipes/{recipe['id']}/shares", json={"user_ids": []}, headers=bruno)

    assert detail.status_code == 200
    assert detail.json()["is_own"] is False
    as_author = client.get(f"/recipes/{recipe['id']}", headers=anna).json()
    assert detail.json()["ingredients"] == as_author["ingredients"]
    assert detail.json()["steps"] == as_author["steps"]
    assert update.status_code == 403
    assert update.json()["code"] == "RECIPE_READ_ONLY"
    assert delete.status_code == 403
    assert shares.status_code == 403
    assert reshare.status_code == 403
    assert client.get(f"/recipes/{recipe['id']}", headers=anna).json()["title"] == "Originale"


def test_rating_is_visible_to_recipients_but_only_the_author_can_change_it(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    recipe = create(client, anna, title="Originale", rating=8, source_url="https://example.com/a")
    share(client, anna, recipe["id"], bruno)

    seen_by_bruno = client.get(f"/recipes/{recipe['id']}", headers=bruno).json()
    listed_for_bruno = listed(client, bruno, scope="shared")
    rerate = client.put(
        f"/recipes/{recipe['id']}",
        json=recipe_payload(title="Originale", rating=1, source_url="https://example.com/b"),
        headers=bruno,
    )
    delete = client.delete(f"/recipes/{recipe['id']}", headers=bruno)

    assert seen_by_bruno["rating"] == 8
    assert listed_for_bruno[0]["rating"] == 8
    assert rerate.status_code == 403
    assert rerate.json()["code"] == "RECIPE_READ_ONLY"
    assert delete.status_code == 403
    unchanged = client.get(f"/recipes/{recipe['id']}", headers=anna).json()
    assert unchanged["rating"] == 8
    assert unchanged["source_url"] == "https://example.com/a"


def test_copy_starts_without_a_rating(client: TestClient, household: dict[str, Headers]) -> None:
    anna, bruno = household["anna"], household["bruno"]
    recipe = create(client, anna, rating=9)
    share(client, anna, recipe["id"], bruno)

    copied = copy_of(client, bruno, recipe["id"])

    assert copied["rating"] is None
    assert client.get(f"/recipes/{recipe['id']}", headers=anna).json()["rating"] == 9


def test_non_recipients_cannot_see_recipe_or_photos(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno, carla = household["anna"], household["bruno"], household["carla"]
    cover = upload_id(client, anna)
    step_photo = upload_id(client, anna)
    recipe = recipe_with_photos(client, anna, cover=cover, step=step_photo)
    share(client, anna, recipe["id"], bruno)

    for photo_id in (cover, step_photo):
        assert client.get(f"/photos/{photo_id}", headers=bruno).status_code == 200
        thumb = client.get(f"/photos/{photo_id}", params={"size": "thumb"}, headers=bruno)
        assert thumb.status_code == 200
        assert client.get(f"/photos/{photo_id}", headers=carla).status_code == 404
        assert client.get(f"/photos/{photo_id}", headers=household["dario"]).status_code == 404
    assert client.get(f"/recipes/{recipe['id']}", headers=carla).status_code == 404
    assert client.post(f"/recipes/{recipe['id']}/copy", headers=carla).status_code == 404

    share(client, anna, recipe["id"])

    assert client.get(f"/photos/{cover}", headers=bruno).status_code == 404


def test_search_includes_shared_recipes_and_tells_them_apart(
    client: TestClient, household: dict[str, Headers], clock: FakeClock
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    zucchine = [{"name": "zucchine"}]
    shared = create(client, anna, title="Zucchine di Anna", ingredients=zucchine)
    create(client, anna, title="Zucchine segrete", ingredients=zucchine)
    share(client, anna, shared["id"], bruno)
    clock.advance(timedelta(minutes=1))
    create(client, bruno, title="Zucchine di Bruno", ingredients=zucchine)

    found = listed(client, bruno, ingredient="zucchina")

    assert [(item["title"], item["is_own"]) for item in found] == [
        ("Zucchine di Bruno", True),
        ("Zucchine di Anna", False),
    ]
    assert [item["title"] for item in listed(client, bruno, q="segrete")] == []


def test_recipients_see_only_starter_tags_and_can_filter_by_them(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    dolci = tag_id(client, anna, "Dolci")
    natale = create_tag(client, anna, "Natale")
    recipe = create(client, anna, title="Panettone", tag_ids=[dolci, natale["id"]])
    share(client, anna, recipe["id"], bruno)

    detail = client.get(f"/recipes/{recipe['id']}", headers=bruno).json()
    filtered = listed(client, bruno, tag_id=dolci)

    assert [tag["name"] for tag in detail["tags"]] == ["Dolci"]
    assert [item["title"] for item in filtered] == ["Panettone"]
    assert [tag["name"] for tag in listed(client, anna)[0]["tags"]] == ["Dolci", "Natale"]


def test_copy_creates_an_independent_recipe_with_duplicated_photos(
    client: TestClient, household: dict[str, Headers], db_session: Session, photos_dir: Path
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    natale = create_tag(client, anna, "Natale")
    payload_tags = [tag_id(client, anna, "Dolci"), natale["id"]]
    cover = upload_id(client, anna)
    step_photo = upload_id(client, anna)
    original = recipe_with_photos(client, anna, cover=cover, step=step_photo)
    original = client.put(
        f"/recipes/{original['id']}",
        json={
            **recipe_payload(cover_photo_id=cover, tag_ids=payload_tags),
            "steps": [
                {**step, "photo_id": step_photo if index == 0 else None}
                for index, step in enumerate(recipe_payload()["steps"])
            ],
        },
        headers=anna,
    ).json()
    share(client, anna, original["id"], bruno)

    copied = copy_of(client, bruno, original["id"])

    assert copied["id"] != original["id"]
    assert copied["is_own"] is True
    assert copied["author"]["display_name"] == "Bruno"
    assert copied["title"] == original["title"]
    assert [i["name"] for i in copied["ingredients"]] == [
        i["name"] for i in original["ingredients"]
    ]
    assert [s["text"] for s in copied["steps"]] == [s["text"] for s in original["steps"]]
    assert [tag["name"] for tag in copied["tags"]] == ["Dolci"]
    row = db_session.get(Recipe, copied["id"])
    assert row is not None
    assert str(row.copied_from_recipe_id) == original["id"]
    assert copied["cover_photo_id"] not in (None, cover)
    assert copied["steps"][0]["photo_id"] not in (None, step_photo)
    copied_photos = db_session.scalars(
        select(Photo).where(
            Photo.id.in_([copied["cover_photo_id"], copied["steps"][0]["photo_id"]])
        )
    ).all()
    assert {str(photo.owner_id) for photo in copied_photos} == {user_id(client, bruno)}
    assert len([path for path in photos_dir.rglob("*") if path.is_file()]) == 8
    assert client.get(f"/photos/{copied['cover_photo_id']}", headers=bruno).status_code == 200


def test_copy_can_be_edited_by_its_new_owner(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    original = create(client, anna)
    share(client, anna, original["id"], bruno)
    copied = copy_of(client, bruno, original["id"])

    response = client.put(
        f"/recipes/{copied['id']}", json=recipe_payload(title="La mia versione"), headers=bruno
    )

    assert response.status_code == 200
    assert client.get(f"/recipes/{original['id']}", headers=anna).json()["title"] != (
        "La mia versione"
    )


def test_changes_to_the_original_do_not_change_copies(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    original = create(client, anna, title="Ragù")
    share(client, anna, original["id"], bruno)
    copied = copy_of(client, bruno, original["id"])

    client.put(
        f"/recipes/{original['id']}",
        json=recipe_payload(title="Ragù cambiato", ingredients=[{"name": "carne"}]),
        headers=anna,
    )

    detail = client.get(f"/recipes/{copied['id']}", headers=bruno).json()
    assert detail["title"] == "Ragù"
    assert [i["name"] for i in detail["ingredients"]] == ["spaghetti", "olio", "sale"]


def test_deleting_the_original_keeps_copies_and_clears_the_link(
    client: TestClient, household: dict[str, Headers], db_session: Session
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    cover = upload_id(client, anna)
    original = recipe_with_photos(client, anna, cover=cover, step=None)
    share(client, anna, original["id"], bruno)
    copied = copy_of(client, bruno, original["id"])

    client.delete(f"/recipes/{original['id']}", headers=anna)

    detail = client.get(f"/recipes/{copied['id']}", headers=bruno)
    assert detail.status_code == 200
    row = db_session.get(Recipe, copied["id"])
    assert row is not None
    db_session.refresh(row)
    assert row.copied_from_recipe_id is None
    assert client.get(f"/photos/{copied['cover_photo_id']}", headers=bruno).status_code == 200


def test_recipient_can_make_several_copies(
    client: TestClient, household: dict[str, Headers]
) -> None:
    anna, bruno = household["anna"], household["bruno"]
    original = create(client, anna, title="Pane")
    share(client, anna, original["id"], bruno)

    first = copy_of(client, bruno, original["id"])
    second = copy_of(client, bruno, original["id"])

    assert first["id"] != second["id"]
    assert [item["title"] for item in listed(client, bruno, scope="mine")] == ["Pane", "Pane"]


def test_author_cannot_copy_own_recipe(client: TestClient, household: dict[str, Headers]) -> None:
    anna = household["anna"]
    recipe = create(client, anna)

    response = client.post(f"/recipes/{recipe['id']}/copy", headers=anna)

    assert response.status_code == 409
    assert response.json()["code"] == "CANNOT_COPY_OWN"


def mutual_shares(client: TestClient, household: dict[str, Headers]) -> tuple[str, str, str]:
    anna, bruno, carla = household["anna"], household["bruno"], household["carla"]
    from_anna = create(client, anna, title="Di Anna")["id"]
    from_bruno = create(client, bruno, title="Di Bruno")["id"]
    between_others = create(client, carla, title="Di Carla")["id"]
    share(client, anna, from_anna, bruno, carla)
    share(client, bruno, from_bruno, anna, carla)
    share(client, carla, between_others, anna)
    return from_anna, from_bruno, between_others


def assert_shares_of_bruno_revoked(client: TestClient, household: dict[str, Headers]) -> None:
    anna, bruno, carla = household["anna"], household["bruno"], household["carla"]
    assert listed(client, bruno, scope="shared") == []
    assert [item["title"] for item in listed(client, anna, scope="shared")] == ["Di Carla"]
    assert [item["title"] for item in listed(client, carla, scope="shared")] == ["Di Anna"]


def test_leaving_the_household_revokes_shares_to_and_from_the_member(
    client: TestClient, household: dict[str, Headers]
) -> None:
    from_anna, _, _ = mutual_shares(client, household)
    copied = copy_of(client, household["bruno"], from_anna)

    assert client.post("/household/leave", headers=household["bruno"]).status_code == 200

    assert_shares_of_bruno_revoked(client, household)
    assert client.get(f"/recipes/{copied['id']}", headers=household["bruno"]).status_code == 200


def test_removing_a_member_revokes_shares_to_and_from_them(
    client: TestClient, household: dict[str, Headers]
) -> None:
    mutual_shares(client, household)
    bruno_id = user_id(client, household["bruno"])

    response = client.delete(f"/household/members/{bruno_id}", headers=household["anna"])

    assert response.status_code == 204
    assert_shares_of_bruno_revoked(client, household)


def test_shares_require_login(client: TestClient, household: dict[str, Headers]) -> None:
    recipe = create(client, household["anna"])

    assert client.get(f"/recipes/{recipe['id']}/shares").status_code == 401
    assert client.post(f"/recipes/{recipe['id']}/copy").status_code == 401
