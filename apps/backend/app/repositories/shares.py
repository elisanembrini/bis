import uuid
from collections.abc import Collection
from datetime import datetime

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.models import Recipe, RecipeShare


def user_ids_for(db: Session, recipe_id: uuid.UUID) -> set[uuid.UUID]:
    return set(db.scalars(select(RecipeShare.user_id).where(RecipeShare.recipe_id == recipe_id)))


def replace(
    db: Session, recipe_id: uuid.UUID, user_ids: Collection[uuid.UUID], now: datetime
) -> None:
    current = user_ids_for(db, recipe_id)
    wanted = set(user_ids)
    removed = current - wanted
    if removed:
        db.execute(
            delete(RecipeShare).where(
                RecipeShare.recipe_id == recipe_id, RecipeShare.user_id.in_(removed)
            )
        )
    for user_id in wanted - current:
        db.add(RecipeShare(recipe_id=recipe_id, user_id=user_id, created_at=now))
    db.flush()


def delete_involving(db: Session, user_id: uuid.UUID) -> None:
    owned = select(Recipe.id).where(Recipe.owner_id == user_id)
    db.execute(
        delete(RecipeShare).where(
            or_(RecipeShare.user_id == user_id, RecipeShare.recipe_id.in_(owned))
        )
    )
