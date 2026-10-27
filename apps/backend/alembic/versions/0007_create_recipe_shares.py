from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "recipe_shares",
        sa.Column("recipe_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["recipe_id"],
            ["recipes.id"],
            name=op.f("fk_recipe_shares_recipe_id_recipes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_recipe_shares_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("recipe_id", "user_id", name=op.f("pk_recipe_shares")),
    )
    op.create_index(op.f("ix_recipe_shares_user_id"), "recipe_shares", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recipe_shares_user_id"), table_name="recipe_shares")
    op.drop_table("recipe_shares")
