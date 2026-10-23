def sanitize_redirect(value: str | None) -> str | None:
    if value is None:
        return None
    if not value.startswith("/") or value.startswith("//") or value.startswith("/\\"):
        return None
    return value
