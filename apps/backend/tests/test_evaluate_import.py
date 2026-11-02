import json
from decimal import Decimal
from typing import Any

from app.core.units import Unit
from app.schemas.recipe import IngredientInput
from app.schemas.recipe_import import RecipeDraft, StepDraft
from scripts.evaluate_import import (
    DEFAULT_CASES,
    average,
    render,
    run_case,
    score_draft,
    score_failure,
)
from tests.test_recipe_import import FakeLlm, extraction

EXPECT: dict[str, Any] = {
    "recipe": True,
    "title": "pomodoro",
    "ingredients": [
        {"name": "spaghetti", "quantity": 320, "unit": "g"},
        {"name": "sale", "quantity": None, "unit": None},
    ],
    "steps_min": 2,
    "steps_max": 3,
    "timers_seconds": [540],
    "servings": 4,
}


def draft(**overrides: Any) -> RecipeDraft:
    values: dict[str, Any] = {
        "title": "Pasta al Pomodoro",
        "servings": 4,
        "ingredients": [
            IngredientInput(quantity=Decimal(320), unit=Unit.G, name="Spaghetti"),
            IngredientInput(name="sale"),
        ],
        "steps": [StepDraft(text="Porta a bollore."), StepDraft(text="Cuoci.", timer_seconds=540)],
    }
    values.update(overrides)
    return RecipeDraft(**values)


def test_a_perfect_draft_scores_one_everywhere() -> None:
    score = score_draft("case", EXPECT, draft(), 1.5)

    assert (
        score.detected,
        score.title,
        score.ingredient_recall,
        score.quantity_accuracy,
        score.steps,
        score.timers,
        score.servings,
    ) == (1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0)
    assert score.seconds == 1.5


def test_wrong_values_lower_the_matching_scores_only() -> None:
    wrong = draft(
        title="Zuppa",
        servings=2,
        ingredients=[IngredientInput(quantity=Decimal(300), unit=Unit.G, name="spaghetti")],
        steps=[StepDraft(text="Cuoci.")],
    )

    score = score_draft("case", EXPECT, wrong, 1.0)

    assert score.title == 0.0
    assert score.ingredient_recall == 0.5
    assert score.quantity_accuracy == 0.0
    assert score.steps == 0.0
    assert score.timers == 0.0
    assert score.servings == 0.0


def test_a_wrong_unit_is_not_an_accurate_quantity() -> None:
    wrong = draft(
        ingredients=[IngredientInput(quantity=Decimal(320), unit=Unit.KG, name="spaghetti")]
    )

    assert score_draft("case", EXPECT, wrong, 1.0).quantity_accuracy == 0.0


def test_failures_only_count_when_no_recipe_was_expected() -> None:
    assert score_failure("c", {"recipe": False}, True, 1.0).detected == 1.0
    assert score_failure("c", {"recipe": False}, False, 1.0).detected == 0.0
    assert score_failure("c", EXPECT, True, 1.0).detected == 0.0


def test_run_case_scores_the_model_reply() -> None:
    llm = FakeLlm()
    case = {"id": "pasta", "text": "Pasta al pomodoro", "expect": EXPECT}

    score = run_case(llm, case, 1000)

    assert score.title == 1.0
    assert score.ingredient_recall == 1.0


def test_run_case_recognizes_content_without_a_recipe() -> None:
    llm = FakeLlm()
    llm.reply = json.dumps(extraction(title="", ingredients=[], steps=[]))

    score = run_case(llm, {"id": "n", "text": "Ciao", "expect": {"recipe": False}}, 1000)

    assert score.detected == 1.0


def test_run_case_survives_model_failures() -> None:
    llm = FakeLlm()
    llm.fail = True

    score = run_case(llm, {"id": "p", "text": "Pasta", "expect": EXPECT}, 1000)

    assert score.detected == 0.0


def test_the_report_has_one_row_per_case_and_a_mean() -> None:
    scores = [
        score_draft("a", EXPECT, draft(), 1.0),
        score_draft("b", EXPECT, draft(title="x"), 3.0),
    ]

    report = render(scores)

    assert "| a |" in report
    assert "| b |" in report
    assert "**mean**" in report
    assert average(scores, "seconds") == 2.0


def test_the_bundled_cases_are_well_formed() -> None:
    cases = json.loads(DEFAULT_CASES.read_text(encoding="utf-8"))["cases"]

    assert len(cases) >= 5
    assert len({case["id"] for case in cases}) == len(cases)
    for case in cases:
        assert case["text"].strip()
        if case["expect"]["recipe"]:
            assert {
                "title",
                "ingredients",
                "steps_min",
                "steps_max",
                "timers_seconds",
                "servings",
            } <= set(case["expect"])
