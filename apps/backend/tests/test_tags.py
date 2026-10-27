from typing import Any

from fastapi.testclient import TestClient

from tests.test_household import Headers, register
from tests.test_recipes import create, recipe_payload

STARTER_TAGS = ["Antipasti", "Contorni", "Dolci", "Primi", "Secondi", "Vegetariano", "Veloce"]


def tags_of(client: TestClient, user: Headers) -> list[dict[str, Any]]:
    response = client.get("/tags", headers=user)
    assert response.status_code == 200
    body: list[dict[str, Any]] = response.json()
    return body


def tag_id(client: TestClient, user: Headers, name: str) -> str:
    found: str = next(tag["id"] for tag in tags_of(client, user) if tag["name"] == name)
    return found


def create_tag(client: TestClient, user: Headers, name: str) -> dict[str, Any]:
    response = client.post("/tags", json={"name": name}, headers=user)
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


def test_every_user_starts_with_the_default_tags(client: TestClient) -> None:
    anna = register(client, "Anna")

    tags = tags_of(client, anna)

    assert sorted(tag["name"] for tag in tags) == STARTER_TAGS
    assert all(tag["is_own"] is False for tag in tags)


def test_user_creates_personal_tags_visible_only_to_them(client: TestClient) -> None:
    anna = register(client, "Anna")
    bruno = register(client, "Bruno")

    created = create_tag(client, anna, "  Natale ")

    assert created["name"] == "Natale"
    assert created["is_own"] is True
    assert "Natale" in [tag["name"] for tag in tags_of(client, anna)]
    assert "Natale" not in [tag["name"] for tag in tags_of(client, bruno)]
    assert create_tag(client, bruno, "Natale")["is_own"] is True


def test_personal_tags_are_unique_ignoring_case(client: TestClient) -> None:
    anna = register(client, "Anna")
    create_tag(client, anna, "Natale")

    duplicate = client.post("/tags", json={"name": "NATALE"}, headers=anna)
    starter = client.post("/tags", json={"name": "primi"}, headers=anna)

    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "TAG_ALREADY_EXISTS"
    assert starter.status_code == 409


def test_tag_name_is_required(client: TestClient) -> None:
    anna = register(client, "Anna")

    assert client.post("/tags", json={"name": "  "}, headers=anna).status_code == 422
    assert client.post("/tags", json={"name": "x" * 51}, headers=anna).status_code == 422


def test_user_deletes_own_tag(client: TestClient) -> None:
    anna = register(client, "Anna")
    created = create_tag(client, anna, "Natale")

    response = client.delete(f"/tags/{created['id']}", headers=anna)

    assert response.status_code == 204
    assert "Natale" not in [tag["name"] for tag in tags_of(client, anna)]


def test_starter_tags_and_tags_of_others_cannot_be_deleted(client: TestClient) -> None:
    anna = register(client, "Anna")
    bruno = register(client, "Bruno")
    annas_tag = create_tag(client, anna, "Natale")

    starter = client.delete(f"/tags/{tag_id(client, anna, 'Primi')}", headers=anna)
    others = client.delete(f"/tags/{annas_tag['id']}", headers=bruno)

    assert starter.status_code == 404
    assert starter.json()["code"] == "TAG_NOT_FOUND"
    assert others.status_code == 404
    assert "Primi" in [tag["name"] for tag in tags_of(client, anna)]
    assert "Natale" in [tag["name"] for tag in tags_of(client, anna)]


def test_recipe_gets_starter_and_personal_tags(client: TestClient) -> None:
    anna = register(client, "Anna")
    natale = create_tag(client, anna, "Natale")

    recipe = create(client, anna, tag_ids=[natale["id"], tag_id(client, anna, "Dolci")])

    assert [tag["name"] for tag in recipe["tags"]] == ["Dolci", "Natale"]
    listed = client.get("/recipes", headers=anna).json()
    assert [tag["name"] for tag in listed[0]["tags"]] == ["Dolci", "Natale"]


def test_deleting_a_used_tag_removes_it_from_recipes_that_remain(client: TestClient) -> None:
    anna = register(client, "Anna")
    natale = create_tag(client, anna, "Natale")
    recipe = create(client, anna, tag_ids=[natale["id"], tag_id(client, anna, "Dolci")])

    client.delete(f"/tags/{natale['id']}", headers=anna)

    detail = client.get(f"/recipes/{recipe['id']}", headers=anna)
    assert detail.status_code == 200
    assert [tag["name"] for tag in detail.json()["tags"]] == ["Dolci"]


def test_cannot_use_a_tag_of_another_user(client: TestClient) -> None:
    anna = register(client, "Anna")
    bruno = register(client, "Bruno")
    annas_tag = create_tag(client, anna, "Natale")

    response = client.post(
        "/recipes", json=recipe_payload(tag_ids=[annas_tag["id"]]), headers=bruno
    )

    assert response.status_code == 422
    assert response.json()["code"] == "TAG_NOT_AVAILABLE"


def test_updating_tags_replaces_them(client: TestClient) -> None:
    anna = register(client, "Anna")
    recipe = create(client, anna, tag_ids=[tag_id(client, anna, "Primi")])

    response = client.put(
        f"/recipes/{recipe['id']}",
        json=recipe_payload(tag_ids=[tag_id(client, anna, "Veloce")]),
        headers=anna,
    )

    assert [tag["name"] for tag in response.json()["tags"]] == ["Veloce"]


def test_filter_recipes_by_tag(client: TestClient) -> None:
    anna = register(client, "Anna")
    dolci = tag_id(client, anna, "Dolci")
    cake = create(client, anna, title="Torta", tag_ids=[dolci])
    create(client, anna, title="Pasta", tag_ids=[tag_id(client, anna, "Primi")])
    create(client, anna, title="Senza etichette")

    listed = client.get("/recipes", params={"tag_id": dolci}, headers=anna).json()

    assert [recipe["id"] for recipe in listed] == [cake["id"]]


def test_tags_require_login(client: TestClient) -> None:
    assert client.get("/tags").status_code == 401
    assert client.post("/tags", json={"name": "Natale"}).status_code == 401
