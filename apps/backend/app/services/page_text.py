import re
from html.parser import HTMLParser

SKIPPED_TAGS = frozenset({"script", "style", "noscript", "svg", "nav", "header", "footer", "form"})
WHITESPACE = re.compile(r"\s+")


class _PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text_parts: list[str] = []
        self.structured_parts: list[str] = []
        self._skip_depth = 0
        self._in_structured = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "script" and dict(attrs).get("type") == "application/ld+json":
            self._in_structured = True
            return
        if tag in SKIPPED_TAGS:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_structured:
            self._in_structured = False
            return
        if tag in SKIPPED_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._in_structured:
            self.structured_parts.append(data)
        elif self._skip_depth == 0:
            self.text_parts.append(data)


def _collapse(parts: list[str]) -> str:
    return WHITESPACE.sub(" ", " ".join(parts)).strip()


def extract_page_content(html: str, max_chars: int) -> str:
    parser = _PageParser()
    parser.feed(html)
    parser.close()
    sections: list[str] = []
    structured = _collapse(parser.structured_parts)
    if "Recipe" in structured:
        sections.append(f"Structured data: {structured}")
    sections.append(f"Page text: {_collapse(parser.text_parts)}")
    return "\n\n".join(sections)[:max_chars]
