import json
from pathlib import Path

from app.main import app

OUTPUT = Path(__file__).resolve().parents[3] / "openapi.json"


def main() -> None:
    OUTPUT.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
