from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "photos",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("storage_key", sa.String(length=64), nullable=False),
        sa.Column("content_type", sa.String(length=50), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], name=op.f("fk_photos_owner_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_photos")),
        sa.UniqueConstraint("storage_key", name=op.f("uq_photos_storage_key")),
    )
    op.create_index(
        "ix_photos_owner_id_created_at", "photos", ["owner_id", "created_at"], unique=False
    )
    op.create_index(op.f("ix_recipes_cover_photo_id"), "recipes", ["cover_photo_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_recipes_cover_photo_id_photos"),
        "recipes",
        "photos",
        ["cover_photo_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_steps_photo_id"), "steps", ["photo_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_steps_photo_id_photos"),
        "steps",
        "photos",
        ["photo_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_steps_photo_id_photos"), "steps", type_="foreignkey")
    op.drop_index(op.f("ix_steps_photo_id"), table_name="steps")
    op.drop_constraint(op.f("fk_recipes_cover_photo_id_photos"), "recipes", type_="foreignkey")
    op.drop_index(op.f("ix_recipes_cover_photo_id"), table_name="recipes")
    op.drop_index("ix_photos_owner_id_created_at", table_name="photos")
    op.drop_table("photos")
