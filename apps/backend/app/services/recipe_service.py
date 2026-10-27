import uuid
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.clock import Clock, get_clock
from app.core.errors import PhotoNotAvailableError, RecipeNotFoundError
from app.core.units import Unit
from app.db import get_db
from app.models import Ingredient, Recipe, Step, User
from app.repositories import photos, recipes
from app.schemas.recipe import (
    IngredientInput,
    IngredientResponse,
    RecipeInput,
    RecipeResponse,
    RecipeSummary,
    StepInput,
    StepResponse,
)
from app.services.photo_storage import PhotoStorage, get_photo_storage


class RecipeService:
    def __init__(self, db: Session, clock: Clock, storage: PhotoStorage) -> None:
        self._db = db
        self._clock = clock
        self._storage = storage

    def list_own(self, user: User) -> list[RecipeSummary]:
        return [_summary(recipe) for recipe in recipes.list_for_owner(self._db, user.id)]

    def get_own(self, user: User, recipe_id: uuid.UUID) -> RecipeResponse:
        return _detail(self._own(user, recipe_id))

    def create(self, user: User, body: RecipeInput) -> RecipeResponse:
        self._check_photos(user, body, recipe_id=None)
        now = self._clock.now()
        recipe = Recipe(owner_id=user.id, created_at=now, updated_at=now)
        _apply(recipe, body)
        recipes.add(self._db, recipe)
        self._db.commit()
        return _detail(recipe)

    def update(self, user: User, recipe_id: uuid.UUID, body: RecipeInput) -> RecipeResponse:
        recipe = self._own(user, recipe_id)
        self._check_photos(user, body, recipe_id=recipe.id)
        previous = _photo_ids(recipe)
        _apply(recipe, body)
        recipe.updated_at = self._clock.now()
        self._db.flush()
        removed_keys = photos.delete_many(self._db, previous - _photo_ids(recipe))
        self._db.commit()
        self._delete_files(removed_keys)
        return _detail(recipe)

    def delete(self, user: User, recipe_id: uuid.UUID) -> None:
        recipe = self._own(user, recipe_id)
        photo_ids = _photo_ids(recipe)
        recipes.delete(self._db, recipe)
        removed_keys = photos.delete_many(self._db, photo_ids)
        self._db.commit()
        self._delete_files(removed_keys)

    def _check_photos(self, user: User, body: RecipeInput, recipe_id: uuid.UUID | None) -> None:
        requested = [body.cover_photo_id, *(step.photo_id for step in body.steps)]
        photo_ids = [photo_id for photo_id in requested if photo_id is not None]
        if len(photo_ids) != len(set(photo_ids)):
            raise PhotoNotAvailableError
        locked = photos.lock_many(self._db, photo_ids)
        if len(locked) != len(photo_ids) or any(photo.owner_id != user.id for photo in locked):
            raise PhotoNotAvailableError
        if any(
            photos.used_by_other_recipe(self._db, photo_id, recipe_id) for photo_id in photo_ids
        ):
            raise PhotoNotAvailableError

    def _delete_files(self, keys: list[str]) -> None:
        for key in keys:
            self._storage.delete(key)

    def _own(self, user: User, recipe_id: uuid.UUID) -> Recipe:
        recipe = recipes.get_for_owner(self._db, recipe_id=recipe_id, owner_id=user.id)
        if recipe is None:
            raise RecipeNotFoundError
        return recipe


def _apply(recipe: Recipe, body: RecipeInput) -> None:
    recipe.title = body.title
    recipe.notes = body.notes
    recipe.prep_minutes = body.prep_minutes
    recipe.cook_minutes = body.cook_minutes
    recipe.servings = body.servings
    recipe.cover_photo_id = body.cover_photo_id
    recipe.ingredients = [
        _ingredient(position, ingredient) for position, ingredient in enumerate(body.ingredients)
    ]
    recipe.steps = [_step(position, step) for position, step in enumerate(body.steps)]


def _ingredient(position: int, ingredient: IngredientInput) -> Ingredient:
    return Ingredient(
        position=position,
        quantity=ingredient.quantity,
        unit=ingredient.unit,
        name=ingredient.name,
    )


def _step(position: int, step: StepInput) -> Step:
    return Step(
        position=position, text=step.text, timer_seconds=step.timer_seconds, photo_id=step.photo_id
    )


def _photo_ids(recipe: Recipe) -> set[uuid.UUID]:
    candidates = [recipe.cover_photo_id, *(step.photo_id for step in recipe.steps)]
    return {photo_id for photo_id in candidates if photo_id is not None}


def _summary(recipe: Recipe) -> RecipeSummary:
    return RecipeSummary(
        id=recipe.id,
        title=recipe.title,
        servings=recipe.servings,
        prep_minutes=recipe.prep_minutes,
        cook_minutes=recipe.cook_minutes,
        cover_photo_id=recipe.cover_photo_id,
        created_at=recipe.created_at,
        updated_at=recipe.updated_at,
    )


def _detail(recipe: Recipe) -> RecipeResponse:
    return RecipeResponse(
        **_summary(recipe).model_dump(),
        notes=recipe.notes,
        ingredients=[
            IngredientResponse(
                id=ingredient.id,
                quantity=ingredient.quantity,
                unit=None if ingredient.unit is None else Unit(ingredient.unit),
                name=ingredient.name,
            )
            for ingredient in recipe.ingredients
        ],
        steps=[
            StepResponse(
                id=step.id, text=step.text, timer_seconds=step.timer_seconds, photo_id=step.photo_id
            )
            for step in recipe.steps
        ],
    )


def get_recipe_service(
    db: Annotated[Session, Depends(get_db)],
    clock: Annotated[Clock, Depends(get_clock)],
    storage: Annotated[PhotoStorage, Depends(get_photo_storage)],
) -> RecipeService:
    return RecipeService(db, clock, storage)
