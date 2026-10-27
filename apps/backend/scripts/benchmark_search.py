import random
import statistics
import time
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, create_engine, insert, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Ingredient, Recipe, User
from app.repositories import recipes
from app.repositories.search import build_tsquery, search_words

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATABASE_NAME = "bis_bench"
RECIPES_PER_USER = 1000
INGREDIENTS_PER_RECIPE = 10
OTHER_USERS = 5
RUNS = 20

WORDS = [
    "zucchine",
    "pomodori",
    "melanzane",
    "patate",
    "cipolla",
    "aglio",
    "basilico",
    "prezzemolo",
    "farina",
    "uova",
    "burro",
    "latte",
    "zucchero",
    "lievito",
    "olio",
    "sale",
    "pepe",
    "riso",
    "pasta",
    "parmigiano",
    "mozzarella",
    "ricotta",
    "funghi",
    "piselli",
    "carote",
    "sedano",
    "pollo",
    "manzo",
    "maiale",
    "salmone",
    "tonno",
    "gamberi",
    "limone",
    "arancia",
    "mele",
    "pere",
    "fragole",
    "cioccolato",
    "panna",
    "mascarpone",
    "caffè",
    "noci",
    "mandorle",
    "pinoli",
    "rosmarino",
    "salvia",
    "timo",
    "peperoni",
    "carciofi",
    "spinaci",
    "lenticchie",
]
DISHES = [
    "Torta",
    "Risotto",
    "Pasta",
    "Insalata",
    "Frittata",
    "Zuppa",
    "Crostata",
    "Lasagne",
    "Polpette",
    "Vellutata",
    "Sformato",
    "Biscotti",
    "Gnocchi",
    "Arrosto",
    "Spezzatino",
]
QUERIES = [
    ("title", "torta"),
    ("title", "risotto funghi"),
    ("title", "zucch"),
    ("title", "la"),
    ("ingredient", "zucchina"),
    ("ingredient", "pomod"),
    ("ingredient", "cipolla aglio"),
]


def database_url() -> str:
    return (
        make_url(get_settings().database_url)
        .set(database=DATABASE_NAME)
        .render_as_string(hide_password=False)
    )


def recreate_database(url: str, *, create: bool) -> None:
    admin = create_engine(make_url(url).set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as connection:
        connection.execute(text(f'DROP DATABASE IF EXISTS "{DATABASE_NAME}"'))
        if create:
            connection.execute(text(f'CREATE DATABASE "{DATABASE_NAME}"'))
    admin.dispose()


def prepare(url: str) -> Engine:
    recreate_database(url, create=True)
    config = Config(BACKEND_DIR / "alembic.ini")
    config.attributes["database_url"] = url
    config.attributes["configure_logger"] = False
    command.upgrade(config, "head")
    return create_engine(url)


def seed(engine: Engine, rng: random.Random) -> uuid.UUID:
    now = datetime.now(UTC)
    user_ids = [uuid.uuid4() for _ in range(OTHER_USERS + 1)]
    with Session(engine) as db:
        db.execute(
            insert(User),
            [
                {"id": user_id, "email": f"{user_id}@bench.test", "display_name": "Bench"}
                for user_id in user_ids
            ],
        )
        for user_id in user_ids:
            recipe_rows: list[dict[str, object]] = []
            ingredient_rows: list[dict[str, object]] = []
            for index in range(RECIPES_PER_USER):
                recipe_id = uuid.uuid4()
                created = now - timedelta(minutes=index)
                title = f"{rng.choice(DISHES)} di {rng.choice(WORDS)} e {rng.choice(WORDS)}"
                recipe_rows.append(
                    {
                        "id": recipe_id,
                        "owner_id": user_id,
                        "title": title,
                        "servings": 4,
                        "created_at": created,
                        "updated_at": created,
                    }
                )
                ingredient_rows.extend(
                    {
                        "id": uuid.uuid4(),
                        "recipe_id": recipe_id,
                        "position": position,
                        "name": f"{rng.choice(WORDS)} {rng.choice(WORDS)}",
                    }
                    for position in range(INGREDIENTS_PER_RECIPE)
                )
            db.execute(insert(Recipe), recipe_rows)
            db.execute(insert(Ingredient), ingredient_rows)
        db.commit()
        db.execute(text("ANALYZE"))
    return user_ids[0]


def measure(engine: Engine, user_id: uuid.UUID) -> None:
    with Session(engine) as db:
        for mode, term in QUERIES:
            words = search_words(term)
            timings = []
            found = 0
            for _ in range(RUNS):
                started = time.perf_counter()
                found = len(
                    recipes.search(
                        db,
                        visible=recipes.visible_recipe_ids(user_id),
                        title_words=words if mode == "title" else [],
                        ingredient_words=words if mode == "ingredient" else [],
                        tag_id=None,
                    )
                )
                timings.append((time.perf_counter() - started) * 1000)
            print(
                f"{mode:<10} {term!r:<18} risultati={found:<4} "
                f"mediana={statistics.median(timings):6.1f} ms  max={max(timings):6.1f} ms"
            )
        query = build_tsquery(search_words("zucchina"))
        compiled = (
            db.query(Recipe.id)
            .filter(Recipe.owner_id == user_id, Recipe.title_search.op("@@")(query))
            .statement.compile(compile_kwargs={"literal_binds": True})
        )
        plan = db.execute(text(f"EXPLAIN ANALYZE {compiled}")).scalars().all()
        print("\n".join(plan))


def main() -> None:
    url = database_url()
    engine = prepare(url)
    user_id = seed(engine, random.Random(42))
    measure(engine, user_id)
    engine.dispose()
    recreate_database(url, create=False)


if __name__ == "__main__":
    main()
