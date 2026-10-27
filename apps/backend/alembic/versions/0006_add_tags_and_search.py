from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

STARTER_TAGS = [
    ("6f1d5a10-0000-4000-8000-000000000001", "Antipasti"),
    ("6f1d5a10-0000-4000-8000-000000000002", "Primi"),
    ("6f1d5a10-0000-4000-8000-000000000003", "Secondi"),
    ("6f1d5a10-0000-4000-8000-000000000004", "Contorni"),
    ("6f1d5a10-0000-4000-8000-000000000005", "Dolci"),
    ("6f1d5a10-0000-4000-8000-000000000006", "Vegetariano"),
    ("6f1d5a10-0000-4000-8000-000000000007", "Veloce"),
]

SEARCH_VECTOR = (
    "to_tsvector('bis_italian'::regconfig, {column}) "
    "|| to_tsvector('bis_simple'::regconfig, {column})"
)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
    op.execute("CREATE TEXT SEARCH CONFIGURATION bis_italian (COPY = pg_catalog.italian)")
    op.execute(
        "ALTER TEXT SEARCH CONFIGURATION bis_italian "
        "ALTER MAPPING FOR hword, hword_part, word WITH unaccent, italian_stem"
    )
    op.execute("CREATE TEXT SEARCH CONFIGURATION bis_simple (COPY = pg_catalog.simple)")
    op.execute(
        "ALTER TEXT SEARCH CONFIGURATION bis_simple "
        "ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple"
    )

    op.add_column(
        "recipes",
        sa.Column(
            "title_search",
            postgresql.TSVECTOR(),
            sa.Computed(SEARCH_VECTOR.format(column="title"), persisted=True),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_recipes_title_search",
        "recipes",
        ["title_search"],
        unique=False,
        postgresql_using="gin",
    )
    op.add_column(
        "ingredients",
        sa.Column(
            "name_search",
            postgresql.TSVECTOR(),
            sa.Computed(SEARCH_VECTOR.format(column="name"), persisted=True),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_ingredients_name_search",
        "ingredients",
        ["name_search"],
        unique=False,
        postgresql_using="gin",
    )

    tags = op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], name=op.f("fk_tags_owner_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tags")),
    )
    op.create_index(
        "uq_tags_owner_id_lower_name",
        "tags",
        ["owner_id", sa.text("lower(name)")],
        unique=True,
        postgresql_nulls_not_distinct=True,
    )
    op.create_table(
        "recipe_tags",
        sa.Column("recipe_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["recipe_id"],
            ["recipes.id"],
            name=op.f("fk_recipe_tags_recipe_id_recipes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"], ["tags.id"], name=op.f("fk_recipe_tags_tag_id_tags"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("recipe_id", "tag_id", name=op.f("pk_recipe_tags")),
    )
    op.create_index(op.f("ix_recipe_tags_tag_id"), "recipe_tags", ["tag_id"], unique=False)

    op.bulk_insert(
        tags,
        [{"id": tag_id, "owner_id": None, "name": name} for tag_id, name in STARTER_TAGS],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_recipe_tags_tag_id"), table_name="recipe_tags")
    op.drop_table("recipe_tags")
    op.drop_index("uq_tags_owner_id_lower_name", table_name="tags")
    op.drop_table("tags")
    op.drop_index("ix_ingredients_name_search", table_name="ingredients")
    op.drop_column("ingredients", "name_search")
    op.drop_index("ix_recipes_title_search", table_name="recipes")
    op.drop_column("recipes", "title_search")
    op.execute("DROP TEXT SEARCH CONFIGURATION bis_simple")
    op.execute("DROP TEXT SEARCH CONFIGURATION bis_italian")
