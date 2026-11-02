from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CONSTRAINT_NAME = "ck_ingredients_unit_allowed"

RENAMES = [
    ("cucchiaio", "tablespoon"),
    ("cucchiaino", "teaspoon"),
    ("tazza", "cup"),
    ("pizzico", "pinch"),
    ("spicchio", "clove"),
    ("pezzi", "pieces"),
]

COMMON_UNITS = ["g", "kg", "ml", "l"]


def unit_condition(units: list[str]) -> str:
    quoted = ", ".join(f"'{unit}'" for unit in units)
    return f"unit IN ({quoted})"


def rename_units(pairs: list[tuple[str, str]]) -> None:
    for old, new in pairs:
        op.execute(
            sa.text("UPDATE ingredients SET unit = :new WHERE unit = :old").bindparams(
                old=old, new=new
            )
        )


def upgrade() -> None:
    op.drop_constraint(op.f(CONSTRAINT_NAME), "ingredients", type_="check")
    rename_units(RENAMES)
    op.create_check_constraint(
        op.f(CONSTRAINT_NAME),
        "ingredients",
        unit_condition(COMMON_UNITS + [new for _, new in RENAMES]),
    )


def downgrade() -> None:
    op.drop_constraint(op.f(CONSTRAINT_NAME), "ingredients", type_="check")
    rename_units([(new, old) for old, new in RENAMES])
    op.create_check_constraint(
        op.f(CONSTRAINT_NAME),
        "ingredients",
        unit_condition(COMMON_UNITS + [old for old, _ in RENAMES]),
    )
