from datetime import timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.conftest import FakeClock
from tests.test_household import Headers, accept, create_invite, register
from tests.test_recipes import create
from tests.test_tags import tag_id


def ingredients(*names: str) -> list[dict[str, Any]]:
    return [{"quantity": None, "unit": None, "name": name} for name in names]


def titles(client: TestClient, user: Headers, **params: str) -> list[str]:
    response = client.get("/recipes", params=params, headers=user)
    assert response.status_code == 200, response.text
    return [recipe["title"] for recipe in response.json()]


@pytest.fixture
def anna(client: TestClient, clock: FakeClock) -> Headers:
    user = register(client, "Anna")
    recipes = [
        ("Frittata di zucchine", ["zucchine", "uova", "parmigiano"]),
        ("Pasta al pomodoro", ["spaghetti", "pomodori pelati", "basilico"]),
        ("Caffè shakerato", ["caffè", "ghiaccio", "zucchero"]),
        ("Lasagne alla bolognese", ["sfoglia", "ragù", "besciamella"]),
        ("Insalata di patate", ["patate", "cipolla rossa", "prezzemolo"]),
    ]
    for title, names in recipes:
        create(client, user, title=title, ingredients=ingredients(*names))
        clock.advance(timedelta(minutes=1))
    return user


def test_without_search_recipes_are_most_recent_first(client: TestClient, anna: Headers) -> None:
    assert titles(client, anna) == [
        "Insalata di patate",
        "Lasagne alla bolognese",
        "Caffè shakerato",
        "Pasta al pomodoro",
        "Frittata di zucchine",
    ]


@pytest.mark.parametrize("term", ["zucchina", "zucchine", "Zucchina", "ZUCCHINE"])
def test_singular_and_plural_ingredients_match(
    client: TestClient, anna: Headers, term: str
) -> None:
    assert titles(client, anna, ingredient=term) == ["Frittata di zucchine"]


def test_singular_title_matches_plural(client: TestClient, anna: Headers) -> None:
    assert titles(client, anna, q="lasagna") == ["Lasagne alla bolognese"]
    assert titles(client, anna, q="patata") == ["Insalata di patate"]


def test_search_ignores_case_and_accents(client: TestClient, anna: Headers) -> None:
    assert titles(client, anna, q="CAFFE") == ["Caffè shakerato"]
    assert titles(client, anna, q="caffè") == ["Caffè shakerato"]
    assert titles(client, anna, ingredient="ragu") == ["Lasagne alla bolognese"]


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"q": "zucch"}, ["Frittata di zucchine"]),
        ({"q": "pomod"}, ["Pasta al pomodoro"]),
        ({"q": "patat"}, ["Insalata di patate"]),
        ({"q": "la"}, ["Lasagne alla bolognese"]),
        ({"ingredient": "cipolla"}, ["Insalata di patate"]),
        ({"ingredient": "cipoll"}, ["Insalata di patate"]),
        ({"ingredient": "parmig"}, ["Frittata di zucchine"]),
    ],
)
def test_incomplete_words_match_while_typing(
    client: TestClient, anna: Headers, params: dict[str, str], expected: list[str]
) -> None:
    assert titles(client, anna, **params) == expected


def test_all_words_must_match(client: TestClient, anna: Headers) -> None:
    assert titles(client, anna, q="pasta pomodoro") == ["Pasta al pomodoro"]
    assert titles(client, anna, q="pasta zucchine") == []
    assert titles(client, anna, ingredient="cipolla rossa") == ["Insalata di patate"]


def test_title_search_does_not_look_at_ingredients(client: TestClient, anna: Headers) -> None:
    assert titles(client, anna, q="basilico") == []
    assert titles(client, anna, ingredient="frittata") == []


def test_title_matches_rank_above_weaker_matches(client: TestClient, anna: Headers) -> None:
    create(
        client,
        anna,
        title="Pomodori ripieni, pomodori al forno",
        ingredients=ingredients("pomodori"),
    )

    assert titles(client, anna, q="pomodori")[0] == "Pomodori ripieni, pomodori al forno"


def test_search_combines_with_tag_filter(client: TestClient, anna: Headers) -> None:
    vegetarian = tag_id(client, anna, "Vegetariano")
    create(
        client,
        anna,
        title="Zucchine ripiene di carne",
        ingredients=ingredients("zucchine", "carne macinata"),
    )
    create(
        client,
        anna,
        title="Zucchine trifolate",
        ingredients=ingredients("zucchine", "aglio"),
        tag_ids=[vegetarian],
    )

    assert titles(client, anna, ingredient="zucchina", tag_id=vegetarian) == ["Zucchine trifolate"]


@pytest.mark.parametrize("term", ["a & b | !:*", "'); drop table recipes; --", "***", "   ", "_"])
def test_special_characters_never_break_the_search(
    client: TestClient, anna: Headers, term: str
) -> None:
    response = client.get("/recipes", params={"q": term}, headers=anna)

    assert response.status_code == 200


def test_text_without_words_is_ignored(client: TestClient, anna: Headers) -> None:
    assert len(titles(client, anna, q="  !! ")) == 5


def test_users_never_find_recipes_of_others(client: TestClient, anna: Headers) -> None:
    bruno = register(client, "Bruno")
    assert accept(client, bruno, create_invite(client, anna)).status_code == 200
    create(client, bruno, title="Zucchine di Bruno", ingredients=ingredients("zucchine"))

    assert titles(client, anna, ingredient="zucchine") == ["Frittata di zucchine"]
    assert titles(client, anna, q="bruno") == []
    assert titles(client, bruno, ingredient="zucchine") == ["Zucchine di Bruno"]
    assert titles(client, bruno, q="frittata") == []


def test_search_follows_recipe_updates(client: TestClient, anna: Headers) -> None:
    recipe = client.get("/recipes", params={"q": "frittata"}, headers=anna).json()[0]
    detail = client.get(f"/recipes/{recipe['id']}", headers=anna).json()
    payload = {
        "title": "Torta salata",
        "servings": detail["servings"],
        "ingredients": ingredients("zucchine", "pasta brisé"),
        "steps": [{"text": step["text"]} for step in detail["steps"]],
    }

    client.put(f"/recipes/{recipe['id']}", json=payload, headers=anna)

    assert titles(client, anna, q="frittata") == []
    assert titles(client, anna, q="torta") == ["Torta salata"]
    assert titles(client, anna, ingredient="brise") == ["Torta salata"]


@pytest.fixture
def rated(client: TestClient, anna: Headers) -> Headers:
    ratings = {
        "Frittata di zucchine": 7,
        "Pasta al pomodoro": 10,
        "Caffè shakerato": 7,
        "Lasagne alla bolognese": None,
        "Insalata di patate": 4,
    }
    for recipe in client.get("/recipes", headers=anna).json():
        detail = client.get(f"/recipes/{recipe['id']}", headers=anna).json()
        payload = {
            "title": detail["title"],
            "servings": detail["servings"],
            "rating": ratings[detail["title"]],
            "ingredients": [
                {"quantity": None, "unit": None, "name": item["name"]}
                for item in detail["ingredients"]
            ],
            "steps": [{"text": step["text"]} for step in detail["steps"]],
        }
        assert client.put(f"/recipes/{recipe['id']}", json=payload, headers=anna).status_code == 200
    return anna


def test_best_rated_recipes_come_first_and_unrated_last(client: TestClient, rated: Headers) -> None:
    assert titles(client, rated, sort="rating") == [
        "Pasta al pomodoro",
        "Caffè shakerato",
        "Frittata di zucchine",
        "Insalata di patate",
        "Lasagne alla bolognese",
    ]


def test_default_order_ignores_ratings(client: TestClient, rated: Headers) -> None:
    assert titles(client, rated)[0] == "Insalata di patate"
    assert titles(client, rated, sort="recent") == titles(client, rated)


def test_minimum_rating_hides_lower_and_unrated_recipes(client: TestClient, rated: Headers) -> None:
    assert titles(client, rated, min_rating="7", sort="rating") == [
        "Pasta al pomodoro",
        "Caffè shakerato",
        "Frittata di zucchine",
    ]
    assert titles(client, rated, min_rating="8") == ["Pasta al pomodoro"]
    assert titles(client, rated, min_rating="10") == ["Pasta al pomodoro"]
    assert len(titles(client, rated, min_rating="1")) == 4


def test_rating_filter_and_sort_combine_with_search_and_tags(
    client: TestClient, rated: Headers
) -> None:
    dolci = tag_id(client, rated, "Dolci")
    pasta = next(r for r in client.get("/recipes", headers=rated).json() if "Pasta" in r["title"])
    detail = client.get(f"/recipes/{pasta['id']}", headers=rated).json()
    client.put(
        f"/recipes/{pasta['id']}",
        json={
            "title": detail["title"],
            "servings": detail["servings"],
            "rating": 10,
            "tag_ids": [dolci],
            "ingredients": [{"name": item["name"]} for item in detail["ingredients"]],
            "steps": [{"text": step["text"]} for step in detail["steps"]],
        },
        headers=rated,
    )

    assert titles(client, rated, tag_id=dolci, min_rating="5") == ["Pasta al pomodoro"]
    assert titles(client, rated, ingredient="zucchine", min_rating="7") == ["Frittata di zucchine"]
    assert titles(client, rated, q="pasta", sort="rating") == ["Pasta al pomodoro"]


@pytest.mark.parametrize(
    "params",
    [{"min_rating": "0"}, {"min_rating": "11"}, {"min_rating": "x"}, {"sort": "alphabetical"}],
)
def test_invalid_rating_filter_or_sort_is_rejected(
    client: TestClient, rated: Headers, params: dict[str, str]
) -> None:
    assert client.get("/recipes", params=params, headers=rated).status_code == 422


def test_rating_filter_never_exposes_recipes_of_others(client: TestClient, rated: Headers) -> None:
    other = register(client, "Bruno")

    assert titles(client, other, min_rating="1", sort="rating") == []
