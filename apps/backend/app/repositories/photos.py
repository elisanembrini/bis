import uuid
from collections.abc import Collection
from datetime import datetime

from sqlalchemy import CompoundSelect, Select, delete, exists, select
from sqlalchemy.orm import Session

from app.models import Photo, Recipe, Step


def add(db: Session, photo: Photo) -> None:
    db.add(photo)
    db.flush()


def get(db: Session, photo_id: uuid.UUID) -> Photo | None:
    return db.get(Photo, photo_id)


def lock_many(db: Session, photo_ids: Collection[uuid.UUID]) -> list[Photo]:
    if not photo_ids:
        return []
    return list(db.scalars(select(Photo).where(Photo.id.in_(photo_ids)).with_for_update()))


def used_by_other_recipe(db: Session, photo_id: uuid.UUID, recipe_id: uuid.UUID | None) -> bool:
    cover = select(Recipe.id).where(Recipe.cover_photo_id == photo_id)
    step = select(Step.recipe_id).where(Step.photo_id == photo_id)
    if recipe_id is not None:
        cover = cover.where(Recipe.id != recipe_id)
        step = step.where(Step.recipe_id != recipe_id)
    return db.scalar(select(exists(cover) | exists(step))) or False


def linked_to_any_of(
    db: Session, photo_id: uuid.UUID, recipe_ids: Select[uuid.UUID] | CompoundSelect[uuid.UUID]
) -> bool:
    cover = select(Recipe.id).where(Recipe.cover_photo_id == photo_id, Recipe.id.in_(recipe_ids))
    step = select(Step.id).where(Step.photo_id == photo_id, Step.recipe_id.in_(recipe_ids))
    return db.scalar(select(exists(cover) | exists(step))) or False


def lock_unlinked_older_than(db: Session, cutoff: datetime) -> list[Photo]:
    return list(
        db.scalars(
            select(Photo)
            .where(
                Photo.created_at < cutoff,
                ~exists().where(Recipe.cover_photo_id == Photo.id),
                ~exists().where(Step.photo_id == Photo.id),
            )
            .with_for_update(skip_locked=True)
        )
    )


def delete_many(db: Session, photo_ids: Collection[uuid.UUID]) -> list[str]:
    if not photo_ids:
        return []
    keys = list(db.scalars(select(Photo.storage_key).where(Photo.id.in_(photo_ids))))
    db.execute(delete(Photo).where(Photo.id.in_(photo_ids)))
    return keys
