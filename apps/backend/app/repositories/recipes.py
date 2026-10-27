import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Recipe


def list_for_owner(db: Session, owner_id: uuid.UUID) -> list[Recipe]:
    return list(
        db.scalars(
            select(Recipe)
            .where(Recipe.owner_id == owner_id)
            .order_by(Recipe.created_at.desc(), Recipe.id.desc())
        )
    )


def get_for_owner(db: Session, *, recipe_id: uuid.UUID, owner_id: uuid.UUID) -> Recipe | None:
    return db.scalar(
        select(Recipe)
        .where(Recipe.id == recipe_id, Recipe.owner_id == owner_id)
        .options(selectinload(Recipe.ingredients), selectinload(Recipe.steps))
    )


def add(db: Session, recipe: Recipe) -> None:
    db.add(recipe)
    db.flush()


def delete(db: Session, recipe: Recipe) -> None:
    db.delete(recipe)
    db.flush()
