import argparse
import json
import sys
import time
import unicodedata
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.core.errors import ImportNoRecipeError
from app.schemas.recipe import IngredientInput
from app.schemas.recipe_import import RecipeDraft
from app.services.llm_client import LlmClient, LlmError, OpenAiCompatibleClient
from app.services.recipe_import_service import extract_recipe

DEFAULT_CASES = Path(__file__).resolve().parents[1] / "evals" / "recipe_import_cases.json"
QUANTITY_TOLERANCE = Decimal("0.001")


@dataclass(frozen=True)
class CaseScore:
    case_id: str
    detected: float
    title: float
    ingredient_recall: float
    quantity_accuracy: float
    steps: float
    timers: float
    servings: float
    seconds: float


def _fold(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def _find_ingredient(draft: RecipeDraft, name: str) -> IngredientInput | None:
    wanted = _fold(name)
    for ingredient in draft.ingredients:
        if wanted in _fold(ingredient.name):
            return ingredient
    return None


def _same_quantity(found: Decimal | None, expected: float | None) -> bool:
    if expected is None or found is None:
        return found is None and expected is None
    return abs(found - Decimal(str(expected))) <= QUANTITY_TOLERANCE


def score_draft(
    case_id: str, expect: dict[str, Any], draft: RecipeDraft, seconds: float
) -> CaseScore:
    expected_ingredients: list[dict[str, Any]] = expect["ingredients"]
    matches = [(item, _find_ingredient(draft, item["name"])) for item in expected_ingredients]
    found = [(item, ingredient) for item, ingredient in matches if ingredient is not None]
    accurate = [
        item
        for item, ingredient in found
        if _same_quantity(ingredient.quantity, item["quantity"])
        and (ingredient.unit.value if ingredient.unit else None) == item["unit"]
    ]
    timers = {step.timer_seconds for step in draft.steps if step.timer_seconds is not None}
    expected_timers: list[int] = expect["timers_seconds"]
    return CaseScore(
        case_id=case_id,
        detected=1.0,
        title=float(_fold(expect["title"]) in _fold(draft.title)),
        ingredient_recall=len(found) / len(expected_ingredients),
        quantity_accuracy=len(accurate) / len(expected_ingredients),
        steps=float(expect["steps_min"] <= len(draft.steps) <= expect["steps_max"]),
        timers=sum(timer in timers for timer in expected_timers) / len(expected_timers),
        servings=float(draft.servings == expect["servings"]),
        seconds=seconds,
    )


def score_failure(
    case_id: str, expect: dict[str, Any], no_recipe: bool, seconds: float
) -> CaseScore:
    detected = 1.0 if (not expect["recipe"] and no_recipe) else 0.0
    zero = 1.0 if detected == 1.0 else 0.0
    return CaseScore(case_id, detected, zero, zero, zero, zero, zero, zero, seconds)


def run_case(llm: LlmClient, case: dict[str, Any], max_chars: int) -> CaseScore:
    expect: dict[str, Any] = case["expect"]
    started = time.monotonic()
    try:
        draft = extract_recipe(llm, case["text"], max_chars)
    except ImportNoRecipeError:
        return score_failure(case["id"], expect, True, time.monotonic() - started)
    except (LlmError, ValueError):
        return score_failure(case["id"], expect, False, time.monotonic() - started)
    seconds = time.monotonic() - started
    if not expect["recipe"]:
        return score_failure(case["id"], expect, False, seconds)
    return score_draft(case["id"], expect, draft, seconds)


def average(scores: list[CaseScore], field: str) -> float:
    return sum(float(getattr(score, field)) for score in scores) / len(scores)


FIELDS = (
    "detected",
    "title",
    "ingredient_recall",
    "quantity_accuracy",
    "steps",
    "timers",
    "servings",
    "seconds",
)


def render(scores: list[CaseScore]) -> str:
    header = "| case | " + " | ".join(FIELDS) + " |"
    divider = "| --- |" + " --- |" * len(FIELDS)
    rows = [
        f"| {score.case_id} | "
        + " | ".join(f"{getattr(score, field):.2f}" for field in FIELDS)
        + " |"
        for score in scores
    ]
    mean = "| **mean** | " + " | ".join(f"{average(scores, field):.2f}" for field in FIELDS) + " |"
    return "\n".join([header, divider, *rows, mean])


def main() -> int:
    parser = argparse.ArgumentParser(description="Measure the quality of the recipe import.")
    parser.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    parser.add_argument("--json", action="store_true")
    arguments = parser.parse_args()

    settings = get_settings()
    if not settings.llm_base_url or not settings.llm_model:
        sys.stderr.write("Set LLM_BASE_URL and LLM_MODEL to run the evaluation.\n")
        return 2
    llm = OpenAiCompatibleClient(
        base_url=settings.llm_base_url,
        model=settings.llm_model,
        api_key=settings.llm_api_key.get_secret_value() if settings.llm_api_key else None,
        timeout_seconds=settings.llm_timeout_seconds,
    )
    cases: list[dict[str, Any]] = json.loads(arguments.cases.read_text(encoding="utf-8"))["cases"]
    scores = [run_case(llm, case, settings.import_max_text_chars) for case in cases]
    if arguments.json:
        sys.stdout.write(json.dumps([score.__dict__ for score in scores], indent=2) + "\n")
    else:
        sys.stdout.write(f"Model: {settings.llm_model}\n\n{render(scores)}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
