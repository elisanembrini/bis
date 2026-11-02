from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

STARTER_KEYS = {
    "6f1d5a10-0000-4000-8000-000000000001": "starters",
    "6f1d5a10-0000-4000-8000-000000000002": "first_courses",
    "6f1d5a10-0000-4000-8000-000000000003": "main_courses",
    "6f1d5a10-0000-4000-8000-000000000004": "side_dishes",
    "6f1d5a10-0000-4000-8000-000000000005": "desserts",
    "6f1d5a10-0000-4000-8000-000000000006": "vegetarian",
    "6f1d5a10-0000-4000-8000-000000000007": "quick",
}


def upgrade() -> None:
    op.add_column("tags", sa.Column("key", sa.String(length=50), nullable=True))
    op.create_unique_constraint(op.f("uq_tags_key"), "tags", ["key"])
    for tag_id, key in STARTER_KEYS.items():
        op.execute(
            sa.text("UPDATE tags SET key = :key WHERE id = :id AND owner_id IS NULL").bindparams(
                sa.bindparam("id", tag_id, type_=sa.Uuid()), key=key
            )
        )


def downgrade() -> None:
    op.drop_constraint(op.f("uq_tags_key"), "tags", type_="unique")
    op.drop_column("tags", "key")
