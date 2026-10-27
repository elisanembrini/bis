import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Computed,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, deferred, mapped_column, relationship

from app.core.units import Unit
from app.models.base import Base
from app.models.tag import Tag, recipe_tags

SEARCH_VECTOR = (
    "to_tsvector('bis_italian'::regconfig, {column}) "
    "|| to_tsvector('bis_simple'::regconfig, {column})"
)

UNIT_VALUES = ", ".join(f"'{unit.value}'" for unit in Unit)


class Recipe(Base):
    __tablename__ = "recipes"
    __table_args__ = (
        CheckConstraint("servings > 0", name="servings_positive"),
        CheckConstraint("prep_minutes >= 0", name="prep_minutes_not_negative"),
        CheckConstraint("cook_minutes >= 0", name="cook_minutes_not_negative"),
        Index("ix_recipes_owner_id_created_at", "owner_id", "created_at"),
        Index("ix_recipes_title_search", "title_search", postgresql_using="gin"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    prep_minutes: Mapped[int | None] = mapped_column(Integer)
    cook_minutes: Mapped[int | None] = mapped_column(Integer)
    servings: Mapped[int] = mapped_column(Integer)
    cover_photo_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("photos.id", ondelete="SET NULL"), index=True
    )
    copied_from_recipe_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("recipes.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    title_search: Mapped[str] = deferred(
        mapped_column(TSVECTOR, Computed(SEARCH_VECTOR.format(column="title"), persisted=True))
    )

    ingredients: Mapped[list["Ingredient"]] = relationship(
        order_by="Ingredient.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )
    steps: Mapped[list["Step"]] = relationship(
        order_by="Step.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )
    tags: Mapped[list[Tag]] = relationship(
        secondary=recipe_tags,
        order_by=Tag.name,
        passive_deletes=True,
        lazy="raise",
    )


class Ingredient(Base):
    __tablename__ = "ingredients"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="quantity_positive"),
        CheckConstraint(f"unit IN ({UNIT_VALUES})", name="unit_allowed"),
        Index("ix_ingredients_name_search", "name_search", postgresql_using="gin"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), index=True
    )
    position: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 3))
    unit: Mapped[str | None] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(200))
    name_search: Mapped[str] = deferred(
        mapped_column(TSVECTOR, Computed(SEARCH_VECTOR.format(column="name"), persisted=True))
    )


class Step(Base):
    __tablename__ = "steps"
    __table_args__ = (
        CheckConstraint("timer_seconds BETWEEN 1 AND 86400", name="timer_seconds_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), index=True
    )
    position: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    timer_seconds: Mapped[int | None] = mapped_column(Integer)
    photo_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("photos.id", ondelete="SET NULL"), index=True
    )
