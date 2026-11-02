from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.schemas.recipe import (
    MAX_ITEMS,
    SERVINGS_MAX,
    TEXT_MAX_LENGTH,
    IngredientInput,
    Minutes,
    StepText,
    Title,
)

IMPORT_TEXT_MAX_LENGTH = 50000
IMPORT_URL_MAX_LENGTH = 2048


class RecipeImportInput(BaseModel):
    text: (
        Annotated[
            str,
            StringConstraints(
                strip_whitespace=True, min_length=1, max_length=IMPORT_TEXT_MAX_LENGTH
            ),
        ]
        | None
    ) = None
    url: (
        Annotated[
            str,
            StringConstraints(
                strip_whitespace=True, min_length=1, max_length=IMPORT_URL_MAX_LENGTH
            ),
        ]
        | None
    ) = None

    @model_validator(mode="after")
    def exactly_one_source(self) -> "RecipeImportInput":
        if (self.text is None) == (self.url is None):
            raise ValueError("Provide either text or url.")
        return self


class StepDraft(BaseModel):
    text: StepText
    timer_seconds: Annotated[int, Field(ge=1)] | None = None


class RecipeDraft(BaseModel):
    title: Title
    notes: Annotated[str, Field(max_length=TEXT_MAX_LENGTH)] | None = None
    prep_minutes: Minutes | None = None
    cook_minutes: Minutes | None = None
    servings: Annotated[int, Field(ge=1, le=SERVINGS_MAX)]
    ingredients: Annotated[list[IngredientInput], Field(min_length=1, max_length=MAX_ITEMS)]
    steps: Annotated[list[StepDraft], Field(min_length=1, max_length=MAX_ITEMS)]
