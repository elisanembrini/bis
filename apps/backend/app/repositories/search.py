import re
from functools import reduce

from sqlalchemy import ColumnElement, cast, func, literal
from sqlalchemy.dialects.postgresql import REGCONFIG, TSQUERY

WORD = re.compile(r"[^\W_]+")
MAX_WORDS = 8
MAX_WORD_LENGTH = 50
STEMMED_CONFIG = "bis_italian"
PREFIX_CONFIG = "bis_simple"


def search_words(text: str | None) -> list[str]:
    if text is None:
        return []
    return [word[:MAX_WORD_LENGTH] for word in WORD.findall(text)][:MAX_WORDS]


def _tsquery(config: str, expression: str) -> ColumnElement[str]:
    return func.to_tsquery(cast(literal(config), REGCONFIG), literal(expression), type_=TSQUERY)


def build_tsquery(words: list[str]) -> ColumnElement[str]:
    last = len(words) - 1
    per_word = [
        _tsquery(STEMMED_CONFIG, f"{word}:*" if index == last else word).op(
            "||", return_type=TSQUERY
        )(_tsquery(PREFIX_CONFIG, f"{word}:*"))
        for index, word in enumerate(words)
    ]
    return reduce(lambda left, right: left.op("&&", return_type=TSQUERY)(right), per_word)
