from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "recipes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("prep_minutes", sa.Integer(), nullable=True),
        sa.Column("cook_minutes", sa.Integer(), nullable=True),
        sa.Column("servings", sa.Integer(), nullable=False),
        sa.Column("cover_photo_id", sa.Uuid(), nullable=True),
        sa.Column("copied_from_recipe_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("cook_minutes >= 0", name=op.f("ck_recipes_cook_minutes_not_negative")),
        sa.CheckConstraint("prep_minutes >= 0", name=op.f("ck_recipes_prep_minutes_not_negative")),
        sa.CheckConstraint("servings > 0", name=op.f("ck_recipes_servings_positive")),
        sa.ForeignKeyConstraint(
            ["copied_from_recipe_id"],
            ["recipes.id"],
            name=op.f("fk_recipes_copied_from_recipe_id_recipes"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], name=op.f("fk_recipes_owner_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recipes")),
    )
    op.create_index(
        "ix_recipes_owner_id_created_at", "recipes", ["owner_id", "created_at"], unique=False
    )
    op.create_table(
        "ingredients",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("recipe_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=3), nullable=True),
        sa.Column("unit", sa.String(length=20), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.CheckConstraint(
            "unit IN ('g', 'kg', 'ml', 'l', 'cucchiaio', "
            "'cucchiaino', 'tazza', 'pizzico', 'spicchio', 'pezzi')",
            name=op.f("ck_ingredients_unit_allowed"),
        ),
        sa.CheckConstraint("quantity > 0", name=op.f("ck_ingredients_quantity_positive")),
        sa.ForeignKeyConstraint(
            ["recipe_id"],
            ["recipes.id"],
            name=op.f("fk_ingredients_recipe_id_recipes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ingredients")),
    )
    op.create_index(op.f("ix_ingredients_recipe_id"), "ingredients", ["recipe_id"], unique=False)
    op.create_table(
        "steps",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("recipe_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("timer_seconds", sa.Integer(), nullable=True),
        sa.Column("photo_id", sa.Uuid(), nullable=True),
        sa.CheckConstraint(
            "timer_seconds BETWEEN 1 AND 86400", name=op.f("ck_steps_timer_seconds_range")
        ),
        sa.ForeignKeyConstraint(
            ["recipe_id"],
            ["recipes.id"],
            name=op.f("fk_steps_recipe_id_recipes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_steps")),
    )
    op.create_index(op.f("ix_steps_recipe_id"), "steps", ["recipe_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_steps_recipe_id"), table_name="steps")
    op.drop_table("steps")
    op.drop_index(op.f("ix_ingredients_recipe_id"), table_name="ingredients")
    op.drop_table("ingredients")
    op.drop_index("ix_recipes_owner_id_created_at", table_name="recipes")
    op.drop_table("recipes")
