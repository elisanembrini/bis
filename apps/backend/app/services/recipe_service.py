import uuid
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.clock import Clock, get_clock
from app.core.errors import (
    CannotCopyOwnError,
    PhotoNotAvailableError,
    RecipeNotFoundError,
    RecipeReadOnlyError,
    ShareNotAllowedError,
    TagNotAvailableError,
)
from app.core.units import Unit
from app.db import get_db
from app.models import Ingredient, Photo, Recipe, Step, Tag, User
from app.repositories import households, photos, recipes, shares, tags
from app.repositories.search import search_words
from app.schemas.recipe import (
    AuthorSummary,
    IngredientInput,
    IngredientResponse,
    RecipeInput,
    RecipeResponse,
    RecipeScope,
    RecipeSummary,
    ShareCandidate,
    StepInput,
    StepResponse,
)
from app.schemas.tag import TagSummary
from app.services.photo_storage import PhotoStorage, get_photo_storage


class RecipeService:
    def __init__(self, db: Session, clock: Clock, storage: PhotoStorage) -> None:
        self._db = db
        self._clock = clock
        self._storage = storage

    def search(
        self,
        user: User,
        *,
        title: str | None,
        ingredient: str | None,
        tag_id: uuid.UUID | None,
        scope: RecipeScope | None = None,
    ) -> list[RecipeSummary]:
        visible = (
            recipes.own_recipe_ids(user.id)
            if scope == "mine"
            else recipes.shared_recipe_ids(user.id)
            if scope == "shared"
            else recipes.visible_recipe_ids(user.id)
        )
        found = recipes.search(
            self._db,
            visible=visible,
            title_words=search_words(title),
            ingredient_words=search_words(ingredient),
            tag_id=tag_id,
        )
        return [_summary(recipe, user) for recipe in found]

    def get(self, user: User, recipe_id: uuid.UUID) -> RecipeResponse:
        return _detail(self._visible(user, recipe_id), user)

    def create(self, user: User, body: RecipeInput) -> RecipeResponse:
        self._check_photos(user, body, recipe_id=None)
        selected_tags = self._visible_tags(user, body)
        now = self._clock.now()
        recipe = Recipe(owner_id=user.id, owner=user, created_at=now, updated_at=now)
        _apply(recipe, body, selected_tags)
        recipes.add(self._db, recipe)
        self._db.commit()
        return _detail(recipe, user)

    def update(self, user: User, recipe_id: uuid.UUID, body: RecipeInput) -> RecipeResponse:
        recipe = self._own(user, recipe_id)
        self._check_photos(user, body, recipe_id=recipe.id)
        selected_tags = self._visible_tags(user, body)
        previous = _photo_ids(recipe)
        _apply(recipe, body, selected_tags)
        recipe.updated_at = self._clock.now()
        self._db.flush()
        removed_keys = photos.delete_many(self._db, previous - _photo_ids(recipe))
        self._db.commit()
        self._delete_files(removed_keys)
        return _detail(recipe, user)

    def delete(self, user: User, recipe_id: uuid.UUID) -> None:
        recipe = self._own(user, recipe_id)
        photo_ids = _photo_ids(recipe)
        recipes.delete(self._db, recipe)
        removed_keys = photos.delete_many(self._db, photo_ids)
        self._db.commit()
        self._delete_files(removed_keys)

    def share_candidates(self, user: User, recipe_id: uuid.UUID) -> list[ShareCandidate]:
        recipe = self._own(user, recipe_id)
        shared_with = shares.user_ids_for(self._db, recipe.id)
        return [
            ShareCandidate(
                user_id=member.id,
                display_name=member.display_name,
                shared=member.id in shared_with,
            )
            for member in self._household_members_except(user)
        ]

    def set_shares(
        self, user: User, recipe_id: uuid.UUID, user_ids: list[uuid.UUID]
    ) -> list[ShareCandidate]:
        recipe = self._own(user, recipe_id)
        allowed = {member.id for member in self._household_members_except(user)}
        if not set(user_ids) <= allowed:
            raise ShareNotAllowedError
        shares.replace(self._db, recipe.id, user_ids, self._clock.now())
        self._db.commit()
        return self.share_candidates(user, recipe_id)

    def copy(self, user: User, recipe_id: uuid.UUID) -> RecipeResponse:
        original = self._visible(user, recipe_id)
        if original.owner_id == user.id:
            raise CannotCopyOwnError
        now = self._clock.now()
        copied_keys: list[str] = []
        try:
            photo_map = self._duplicate_photos(original, user, copied_keys)
            copy = Recipe(
                owner_id=user.id,
                owner=user,
                title=original.title,
                notes=original.notes,
                prep_minutes=original.prep_minutes,
                cook_minutes=original.cook_minutes,
                servings=original.servings,
                cover_photo_id=_mapped(photo_map, original.cover_photo_id),
                copied_from_recipe_id=original.id,
                created_at=now,
                updated_at=now,
            )
            copy.ingredients = [
                Ingredient(
                    position=ingredient.position,
                    quantity=ingredient.quantity,
                    unit=ingredient.unit,
                    name=ingredient.name,
                )
                for ingredient in original.ingredients
            ]
            copy.steps = [
                Step(
                    position=step.position,
                    text=step.text,
                    timer_seconds=step.timer_seconds,
                    photo_id=_mapped(photo_map, step.photo_id),
                )
                for step in original.steps
            ]
            copy.tags = [tag for tag in original.tags if tag.owner_id is None]
            recipes.add(self._db, copy)
            self._db.commit()
        except Exception:
            self._db.rollback()
            self._delete_files(copied_keys)
            raise
        return _detail(copy, user)

    def _duplicate_photos(
        self, original: Recipe, user: User, copied_keys: list[str]
    ) -> dict[uuid.UUID, uuid.UUID]:
        photo_map: dict[uuid.UUID, uuid.UUID] = {}
        for photo_id in _photo_ids(original):
            source = photos.get(self._db, photo_id)
            if source is None:
                continue
            new_key = self._storage.duplicate(source.storage_key)
            copied_keys.append(new_key)
            duplicate = Photo(
                owner_id=user.id,
                storage_key=new_key,
                content_type=source.content_type,
                width=source.width,
                height=source.height,
                size_bytes=source.size_bytes,
                created_at=self._clock.now(),
            )
            photos.add(self._db, duplicate)
            photo_map[photo_id] = duplicate.id
        return photo_map

    def _household_members_except(self, user: User) -> list[User]:
        household = households.get_for_user(self._db, user.id)
        if household is None:
            return []
        return [
            member
            for member, _ in households.list_members(self._db, household.id)
            if member.id != user.id
        ]

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

    def _visible_tags(self, user: User, body: RecipeInput) -> list[Tag]:
        requested = set(body.tag_ids)
        found = tags.get_visible_many(self._db, user.id, requested)
        if len(found) != len(requested):
            raise TagNotAvailableError
        return sorted(found, key=lambda tag: tag.name.lower())

    def _delete_files(self, keys: list[str]) -> None:
        for key in keys:
            self._storage.delete(key)

    def _visible(self, user: User, recipe_id: uuid.UUID) -> Recipe:
        recipe = recipes.get_visible(self._db, recipe_id=recipe_id, user_id=user.id)
        if recipe is None:
            raise RecipeNotFoundError
        return recipe

    def _own(self, user: User, recipe_id: uuid.UUID) -> Recipe:
        recipe = self._visible(user, recipe_id)
        if recipe.owner_id != user.id:
            raise RecipeReadOnlyError
        return recipe


def _apply(recipe: Recipe, body: RecipeInput, selected_tags: list[Tag]) -> None:
    recipe.title = body.title
    recipe.notes = body.notes
    recipe.prep_minutes = body.prep_minutes
    recipe.cook_minutes = body.cook_minutes
    recipe.servings = body.servings
    recipe.cover_photo_id = body.cover_photo_id
    recipe.tags = selected_tags
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


def _mapped(photo_map: dict[uuid.UUID, uuid.UUID], photo_id: uuid.UUID | None) -> uuid.UUID | None:
    return None if photo_id is None else photo_map.get(photo_id)


def _photo_ids(recipe: Recipe) -> set[uuid.UUID]:
    candidates = [recipe.cover_photo_id, *(step.photo_id for step in recipe.steps)]
    return {photo_id for photo_id in candidates if photo_id is not None}


def _visible_tags_for(recipe: Recipe, viewer: User) -> list[TagSummary]:
    return [
        TagSummary(id=tag.id, name=tag.name)
        for tag in recipe.tags
        if tag.owner_id is None or tag.owner_id == viewer.id
    ]


def _summary(recipe: Recipe, viewer: User) -> RecipeSummary:
    return RecipeSummary(
        id=recipe.id,
        title=recipe.title,
        is_own=recipe.owner_id == viewer.id,
        author=AuthorSummary(id=recipe.owner.id, display_name=recipe.owner.display_name),
        servings=recipe.servings,
        prep_minutes=recipe.prep_minutes,
        cook_minutes=recipe.cook_minutes,
        cover_photo_id=recipe.cover_photo_id,
        tags=_visible_tags_for(recipe, viewer),
        created_at=recipe.created_at,
        updated_at=recipe.updated_at,
    )


def _detail(recipe: Recipe, viewer: User) -> RecipeResponse:
    return RecipeResponse(
        **_summary(recipe, viewer).model_dump(),
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
