from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("recipes", sa.Column("rating", sa.SmallInteger(), nullable=True))
    op.create_check_constraint(
        op.f("ck_recipes_rating_range"), "recipes", "rating BETWEEN 1 AND 10"
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_recipes_rating_range"), "recipes", type_="check")
    op.drop_column("recipes", "rating")
