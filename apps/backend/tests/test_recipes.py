from datetime import timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Ingredient, Step
from tests.conftest import FakeClock
from tests.test_household import Headers, accept, create_invite, register


def recipe_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "title": "Pasta al pomodoro",
        "notes": "Meglio con il basilico fresco.",
        "prep_minutes": 10,
        "cook_minutes": 15,
        "servings": 4,
        "ingredients": [
            {"quantity": "320", "unit": "g", "name": "spaghetti"},
            {"quantity": "1.5", "unit": "tablespoon", "name": "olio"},
            {"quantity": None, "unit": None, "name": "sale"},
        ],
        "steps": [
            {"text": "Porta a bollore l'acqua.", "timer_seconds": None},
            {"text": "Cuoci la pasta.", "timer_seconds": 540},
        ],
    }
    payload.update(overrides)
    return payload


def create(client: TestClient, user: Headers, **overrides: Any) -> dict[str, Any]:
    response = client.post("/recipes", json=recipe_payload(**overrides), headers=user)
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


def test_saved_recipe_appears_in_own_recipe_book(client: TestClient) -> None:
    anna = register(client, "Anna")

    created = create(client, anna)

    listed = client.get("/recipes", headers=anna).json()
    assert [recipe["id"] for recipe in listed] == [created["id"]]
    detail = client.get(f"/recipes/{created['id']}", headers=anna).json()
    assert detail["title"] == "Pasta al pomodoro"
    assert detail["servings"] == 4
    assert detail["notes"] == "Meglio con il basilico fresco."
    assert [step["timer_seconds"] for step in detail["steps"]] == [None, 540]


def test_minimal_recipe_needs_only_title_one_ingredient_and_one_step(
    client: TestClient,
) -> None:
    anna = register(client, "Anna")

    response = client.post(
        "/recipes",
        json={
            "title": "Uovo sodo",
            "servings": 1,
            "ingredients": [{"name": "uovo"}],
            "steps": [{"text": "Cuoci per 9 minuti."}],
        },
        headers=anna,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["notes"] is None
    assert body["prep_minutes"] is None
    assert body["ingredients"][0] == {
        "id": body["ingredients"][0]["id"],
        "quantity": None,
        "unit": None,
        "name": "uovo",
    }


def test_ingredient_without_quantity_is_stored_as_quanto_basta(client: TestClient) -> None:
    anna = register(client, "Anna")

    created = create(client, anna)

    salt = created["ingredients"][2]
    assert salt["name"] == "sale"
    assert salt["quantity"] is None


def test_decimal_quantities_keep_their_precision(client: TestClient) -> None:
    anna = register(client, "Anna")

    created = create(
        client,
        anna,
        ingredients=[{"quantity": "0.125", "unit": "kg", "name": "burro"}],
    )

    assert created["ingredients"][0]["quantity"] == "0.125"


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"title": "   "}, "title"),
        ({"ingredients": []}, "ingredients"),
        ({"steps": []}, "steps"),
        ({"servings": 0}, "servings"),
        ({"ingredients": [{"quantity": "1", "unit": "manciata", "name": "riso"}]}, "unit"),
        ({"ingredients": [{"quantity": "0", "unit": "g", "name": "riso"}]}, "quantity"),
        ({"ingredients": [{"quantity": "-1", "unit": "g", "name": "riso"}]}, "quantity"),
        ({"ingredients": [{"quantity": "1.2345", "unit": "g", "name": "riso"}]}, "quantity"),
        ({"ingredients": [{"quantity": "1,5", "unit": "g", "name": "riso"}]}, "quantity"),
        ({"ingredients": [{"quantity": "1", "unit": "g", "name": " "}]}, "name"),
        ({"steps": [{"text": ""}]}, "text"),
        ({"steps": [{"text": "Cuoci", "timer_seconds": 0}]}, "timer_seconds"),
        ({"rating": 0}, "rating"),
        ({"rating": 11}, "rating"),
        ({"rating": -3}, "rating"),
        ({"rating": 7.5}, "rating"),
        ({"rating": "ottimo"}, "rating"),
        ({"source_url": "javascript:alert(1)"}, "source_url"),
        ({"source_url": "ftp://example.com/ricetta"}, "source_url"),
        ({"source_url": "data:text/html,<script>alert(1)</script>"}, "source_url"),
        ({"source_url": "https://"}, "source_url"),
        ({"source_url": "non è un indirizzo"}, "source_url"),
        ({"source_url": "https://example.com/" + "a" * 2048}, "source_url"),
    ],
)
def test_invalid_recipes_are_rejected(
    client: TestClient, overrides: dict[str, Any], field: str
) -> None:
    anna = register(client, "Anna")

    response = client.post("/recipes", json=recipe_payload(**overrides), headers=anna)

    assert response.status_code == 422
    assert any(field in error["loc"] for error in response.json()["detail"])
    assert client.get("/recipes", headers=anna).json() == []


def test_order_of_ingredients_and_steps_is_preserved(client: TestClient) -> None:
    anna = register(client, "Anna")

    created = create(client, anna)

    assert [i["name"] for i in created["ingredients"]] == ["spaghetti", "olio", "sale"]
    assert [s["text"] for s in created["steps"]] == ["Porta a bollore l'acqua.", "Cuoci la pasta."]


def test_reordering_ingredients_and_steps_is_saved(client: TestClient) -> None:
    anna = register(client, "Anna")
    created = create(client, anna)
    payload = recipe_payload()
    payload["ingredients"] = list(reversed(payload["ingredients"]))
    payload["steps"] = list(reversed(payload["steps"]))

    response = client.put(f"/recipes/{created['id']}", json=payload, headers=anna)

    assert response.status_code == 200
    detail = client.get(f"/recipes/{created['id']}", headers=anna).json()
    assert [i["name"] for i in detail["ingredients"]] == ["sale", "olio", "spaghetti"]
    assert [s["text"] for s in detail["steps"]] == ["Cuoci la pasta.", "Porta a bollore l'acqua."]


def test_update_replaces_fields_and_lists(
    client: TestClient, clock: FakeClock, db_session: Session
) -> None:
    anna = register(client, "Anna")
    created = create(client, anna)
    clock.advance(timedelta(hours=1))

    response = client.put(
        f"/recipes/{created['id']}",
        json=recipe_payload(
            title="Pasta al sugo",
            notes="",
            ingredients=[{"quantity": "200", "unit": "g", "name": "penne"}],
            steps=[{"text": "Tutto in pentola."}],
        ),
        headers=anna,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Pasta al sugo"
    assert body["notes"] is None
    assert [i["name"] for i in body["ingredients"]] == ["penne"]
    assert body["created_at"] == created["created_at"]
    assert body["updated_at"] != created["updated_at"]
    assert db_session.scalar(select(func.count()).select_from(Ingredient)) == 1
    assert db_session.scalar(select(func.count()).select_from(Step)) == 1


def test_deleted_recipe_disappears_with_ingredients_and_steps(
    client: TestClient, db_session: Session
) -> None:
    anna = register(client, "Anna")
    created = create(client, anna)

    response = client.delete(f"/recipes/{created['id']}", headers=anna)

    assert response.status_code == 204
    assert client.get(f"/recipes/{created['id']}", headers=anna).status_code == 404
    assert client.get("/recipes", headers=anna).json() == []
    assert db_session.scalar(select(func.count()).select_from(Ingredient)) == 0
    assert db_session.scalar(select(func.count()).select_from(Step)) == 0


def test_list_shows_only_own_recipes_most_recent_first(
    client: TestClient, clock: FakeClock
) -> None:
    anna = register(client, "Anna")
    bruno = register(client, "Bruno")
    first = create(client, anna, title="Prima")
    clock.advance(timedelta(minutes=5))
    second = create(client, anna, title="Seconda")
    create(client, bruno, title="Di Bruno")
    clock.advance(timedelta(minutes=5))
    client.put(f"/recipes/{first['id']}", json=recipe_payload(title="Prima"), headers=anna)

    listed = client.get("/recipes", headers=anna).json()

    assert [recipe["id"] for recipe in listed] == [second["id"], first["id"]]


def household_with_recipe(client: TestClient) -> tuple[Headers, Headers, str]:
    anna = register(client, "Anna")
    bruno = register(client, "Bruno")
    assert accept(client, bruno, create_invite(client, anna)).status_code == 200
    recipe_id: str = create(client, anna)["id"]
    return anna, bruno, recipe_id


def test_other_users_cannot_see_a_recipe_even_in_the_same_household(
    client: TestClient,
) -> None:
    _, bruno, recipe_id = household_with_recipe(client)

    response = client.get(f"/recipes/{recipe_id}", headers=bruno)

    assert response.status_code == 404
    assert response.json()["code"] == "RECIPE_NOT_FOUND"
    assert client.get("/recipes", headers=bruno).json() == []


def test_only_the_author_can_update_a_recipe(client: TestClient) -> None:
    anna, bruno, recipe_id = household_with_recipe(client)

    response = client.put(
        f"/recipes/{recipe_id}", json=recipe_payload(title="Rubata"), headers=bruno
    )

    assert response.status_code == 404
    assert client.get(f"/recipes/{recipe_id}", headers=anna).json()["title"] == "Pasta al pomodoro"


def test_only_the_author_can_delete_a_recipe(client: TestClient) -> None:
    anna, bruno, recipe_id = household_with_recipe(client)

    response = client.delete(f"/recipes/{recipe_id}", headers=bruno)

    assert response.status_code == 404
    assert client.get(f"/recipes/{recipe_id}", headers=anna).status_code == 200


def test_recipes_require_login(client: TestClient) -> None:
    anna = register(client, "Anna")
    recipe_id = create(client, anna)["id"]

    assert client.get("/recipes").status_code == 401
    assert client.post("/recipes", json=recipe_payload()).status_code == 401
    assert client.get(f"/recipes/{recipe_id}").status_code == 401
    assert client.put(f"/recipes/{recipe_id}", json=recipe_payload()).status_code == 401
    assert client.delete(f"/recipes/{recipe_id}").status_code == 401


def test_unknown_recipe_is_not_found(client: TestClient) -> None:
    anna = register(client, "Anna")

    response = client.get("/recipes/00000000-0000-4000-8000-000000000000", headers=anna)

    assert response.status_code == 404


def test_source_link_is_saved_and_returned(client: TestClient) -> None:
    anna = register(client, "Anna")

    created = create(client, anna, source_url="https://www.giallozafferano.it/ricetta")

    detail = client.get(f"/recipes/{created['id']}", headers=anna).json()
    assert detail["source_url"] == "https://www.giallozafferano.it/ricetta"


def test_source_link_is_optional(client: TestClient) -> None:
    anna = register(client, "Anna")

    created = create(client, anna)

    assert created["source_url"] is None


@pytest.mark.parametrize("blank", ["", "   "])
def test_blank_source_link_is_stored_as_missing(client: TestClient, blank: str) -> None:
    anna = register(client, "Anna")

    created = create(client, anna, source_url=blank)

    assert created["source_url"] is None


def test_source_link_is_trimmed_and_accepts_http(client: TestClient) -> None:
    anna = register(client, "Anna")

    created = create(client, anna, source_url="  http://example.com/ricetta?id=7  ")

    assert created["source_url"] == "http://example.com/ricetta?id=7"


def test_source_link_can_be_changed_and_removed(client: TestClient) -> None:
    anna = register(client, "Anna")
    created = create(client, anna, source_url="https://example.com/uno")

    changed = client.put(
        f"/recipes/{created['id']}",
        json=recipe_payload(source_url="https://example.com/due"),
        headers=anna,
    ).json()
    removed = client.put(f"/recipes/{created['id']}", json=recipe_payload(), headers=anna).json()

    assert changed["source_url"] == "https://example.com/due"
    assert removed["source_url"] is None


@pytest.mark.parametrize("rating", [1, 7, 10])
def test_rating_is_saved_and_returned_in_detail_and_list(client: TestClient, rating: int) -> None:
    anna = register(client, "Anna")

    created = create(client, anna, rating=rating)

    assert created["rating"] == rating
    assert client.get(f"/recipes/{created['id']}", headers=anna).json()["rating"] == rating
    assert client.get("/recipes", headers=anna).json()[0]["rating"] == rating


def test_rating_is_optional_and_can_be_changed_and_removed(client: TestClient) -> None:
    anna = register(client, "Anna")
    created = create(client, anna)
    assert created["rating"] is None

    rated = client.put(
        f"/recipes/{created['id']}", json=recipe_payload(rating=8), headers=anna
    ).json()
    changed = client.put(
        f"/recipes/{created['id']}", json=recipe_payload(rating=9), headers=anna
    ).json()
    removed = client.put(f"/recipes/{created['id']}", json=recipe_payload(), headers=anna).json()

    assert (rated["rating"], changed["rating"], removed["rating"]) == (8, 9, None)
