import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, Field, StringConstraints, field_validator

from app.core.units import Unit
from app.schemas.tag import TagSummary

TITLE_MAX_LENGTH = 200
NAME_MAX_LENGTH = 200
TEXT_MAX_LENGTH = 5000
MAX_ITEMS = 100
TIMER_MAX_SECONDS = 86400
MINUTES_MAX = 10000
SERVINGS_MAX = 100
MAX_TAGS = 20
MAX_SHARES = 50
SEARCH_MAX_LENGTH = 200
SOURCE_URL_MAX_LENGTH = 2048
RATING_MIN = 1
RATING_MAX = 10
SOURCE_URL_SCHEMES = {"http", "https"}

Title = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=TITLE_MAX_LENGTH)
]
IngredientName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=NAME_MAX_LENGTH)
]
StepText = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=TEXT_MAX_LENGTH)
]
Quantity = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=3)]
Minutes = Annotated[int, Field(ge=0, le=MINUTES_MAX)]
Rating = Annotated[int, Field(ge=RATING_MIN, le=RATING_MAX)]


class IngredientInput(BaseModel):
    quantity: Quantity | None = None
    unit: Unit | None = None
    name: IngredientName


class StepInput(BaseModel):
    text: StepText
    timer_seconds: Annotated[int, Field(ge=1, le=TIMER_MAX_SECONDS)] | None = None
    photo_id: uuid.UUID | None = None


class RecipeInput(BaseModel):
    title: Title
    notes: Annotated[str, Field(max_length=TEXT_MAX_LENGTH)] | None = None
    source_url: Annotated[str, Field(max_length=SOURCE_URL_MAX_LENGTH)] | None = None
    rating: Rating | None = None
    prep_minutes: Minutes | None = None
    cook_minutes: Minutes | None = None
    servings: Annotated[int, Field(ge=1, le=SERVINGS_MAX)]
    ingredients: Annotated[list[IngredientInput], Field(min_length=1, max_length=MAX_ITEMS)]
    steps: Annotated[list[StepInput], Field(min_length=1, max_length=MAX_ITEMS)]
    cover_photo_id: uuid.UUID | None = None
    tag_ids: Annotated[list[uuid.UUID], Field(max_length=MAX_TAGS)] = []

    @field_validator("notes")
    @classmethod
    def blank_notes_are_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("source_url")
    @classmethod
    def source_url_is_web_address(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        try:
            parts = urlsplit(stripped)
        except ValueError as error:
            raise ValueError("Enter a valid http or https address.") from error
        if parts.scheme.lower() not in SOURCE_URL_SCHEMES or not parts.hostname:
            raise ValueError("Enter a valid http or https address.")
        return stripped


class IngredientResponse(BaseModel):
    id: uuid.UUID
    quantity: Decimal | None
    unit: Unit | None
    name: str


class StepResponse(BaseModel):
    id: uuid.UUID
    text: str
    timer_seconds: int | None
    photo_id: uuid.UUID | None


class AuthorSummary(BaseModel):
    id: uuid.UUID
    display_name: str


RecipeScope = Literal["mine", "shared"]
RecipeSort = Literal["recent", "rating"]


class RecipeSummary(BaseModel):
    id: uuid.UUID
    title: str
    is_own: bool
    author: AuthorSummary
    servings: int
    rating: int | None
    prep_minutes: int | None
    cook_minutes: int | None
    cover_photo_id: uuid.UUID | None
    tags: list[TagSummary]
    created_at: datetime
    updated_at: datetime


class RecipeResponse(RecipeSummary):
    notes: str | None
    source_url: str | None
    ingredients: list[IngredientResponse]
    steps: list[StepResponse]


class ShareCandidate(BaseModel):
    user_id: uuid.UUID
    display_name: str
    shared: bool


class SharesInput(BaseModel):
    user_ids: Annotated[list[uuid.UUID], Field(max_length=MAX_SHARES)]
