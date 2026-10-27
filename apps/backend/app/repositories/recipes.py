import uuid

from sqlalchemy import CompoundSelect, Select, exists, func, select, union
from sqlalchemy.orm import Session, selectinload

from app.models import Ingredient, Recipe, RecipeShare, recipe_tags
from app.repositories.search import build_tsquery


def own_recipe_ids(user_id: uuid.UUID) -> Select[uuid.UUID]:
    return select(Recipe.id).where(Recipe.owner_id == user_id)


def shared_recipe_ids(user_id: uuid.UUID) -> Select[uuid.UUID]:
    return select(RecipeShare.recipe_id).where(RecipeShare.user_id == user_id)


def visible_recipe_ids(user_id: uuid.UUID) -> CompoundSelect[uuid.UUID]:
    return union(own_recipe_ids(user_id), shared_recipe_ids(user_id))


def search(
    db: Session,
    *,
    visible: Select[uuid.UUID] | CompoundSelect[uuid.UUID],
    title_words: list[str],
    ingredient_words: list[str],
    tag_id: uuid.UUID | None,
) -> list[Recipe]:
    statement = (
        select(Recipe)
        .where(Recipe.id.in_(visible))
        .options(selectinload(Recipe.tags), selectinload(Recipe.owner))
    )
    ordering = []
    if title_words:
        title_query = build_tsquery(title_words)
        statement = statement.where(Recipe.title_search.op("@@")(title_query))
        ordering.append(func.ts_rank(Recipe.title_search, title_query).desc())
    if ingredient_words:
        ingredient_query = build_tsquery(ingredient_words)
        matches = (
            select(
                Ingredient.recipe_id.label("recipe_id"),
                func.max(func.ts_rank(Ingredient.name_search, ingredient_query)).label("rank"),
            )
            .where(
                Ingredient.recipe_id.in_(visible),
                Ingredient.name_search.op("@@")(ingredient_query),
            )
            .group_by(Ingredient.recipe_id)
            .subquery()
        )
        statement = statement.join(matches, matches.c.recipe_id == Recipe.id)
        ordering.append(matches.c.rank.desc())
    if tag_id is not None:
        statement = statement.where(
            exists().where(recipe_tags.c.recipe_id == Recipe.id, recipe_tags.c.tag_id == tag_id)
        )
    return list(
        db.scalars(statement.order_by(*ordering, Recipe.created_at.desc(), Recipe.id.desc()))
    )


def get_visible(db: Session, *, recipe_id: uuid.UUID, user_id: uuid.UUID) -> Recipe | None:
    return db.scalar(
        select(Recipe)
        .where(Recipe.id == recipe_id, Recipe.id.in_(visible_recipe_ids(user_id)))
        .options(
            selectinload(Recipe.ingredients),
            selectinload(Recipe.steps),
            selectinload(Recipe.tags),
            selectinload(Recipe.owner),
        )
    )


def add(db: Session, recipe: Recipe) -> None:
    db.add(recipe)
    db.flush()


def delete(db: Session, recipe: Recipe) -> None:
    db.delete(recipe)
    db.flush()
