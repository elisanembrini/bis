import ipaddress
import socket
from collections.abc import Callable
from typing import Annotated, Protocol
from urllib.parse import urljoin, urlsplit

import httpx2
from fastapi import Depends

from app.core.config import Settings, get_settings

ALLOWED_PORTS = frozenset({None, 80, 443})
MAX_REDIRECTS = 3
USER_AGENT = "Mozilla/5.0 (compatible; BisRecipeImport/1.0)"
HTML_CONTENT_TYPES = ("text/html", "application/xhtml+xml")


class PageFetchError(Exception):
    pass


class PageFetcher(Protocol):
    def fetch_html(self, url: str) -> str: ...


def resolve_host(host: str) -> list[str]:
    try:
        return [
            str(info[4][0]) for info in socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
        ]
    except OSError as exc:
        raise PageFetchError from exc


def _is_public(address: str) -> bool:
    try:
        parsed = ipaddress.ip_address(address.split("%", 1)[0])
    except ValueError:
        return False
    if isinstance(parsed, ipaddress.IPv6Address) and parsed.ipv4_mapped is not None:
        parsed = parsed.ipv4_mapped
    return parsed.is_global


class HttpPageFetcher:
    def __init__(
        self,
        *,
        max_bytes: int,
        timeout_seconds: float = 10,
        resolver: Callable[[str], list[str]] = resolve_host,
        transport: httpx2.BaseTransport | None = None,
    ) -> None:
        self._max_bytes = max_bytes
        self._timeout_seconds = timeout_seconds
        self._resolver = resolver
        self._transport = transport

    def _ensure_public(self, url: str) -> None:
        parts = urlsplit(url)
        try:
            port = parts.port
        except ValueError as exc:
            raise PageFetchError from exc
        if parts.scheme not in {"http", "https"} or not parts.hostname or port not in ALLOWED_PORTS:
            raise PageFetchError
        addresses = self._resolver(parts.hostname)
        if not addresses or not all(_is_public(address) for address in addresses):
            raise PageFetchError

    def fetch_html(self, url: str) -> str:
        current = url
        try:
            with httpx2.Client(
                transport=self._transport, timeout=self._timeout_seconds, follow_redirects=False
            ) as http:
                for _ in range(MAX_REDIRECTS + 1):
                    self._ensure_public(current)
                    with http.stream(
                        "GET", current, headers={"User-Agent": USER_AGENT, "Accept": "text/html"}
                    ) as response:
                        if response.is_redirect:
                            location = response.headers.get("location")
                            if not location:
                                raise PageFetchError
                            current = urljoin(current, location)
                            continue
                        response.raise_for_status()
                        content_type = response.headers.get("content-type", "").lower()
                        if not content_type.startswith(HTML_CONTENT_TYPES):
                            raise PageFetchError
                        body = bytearray()
                        for chunk in response.iter_bytes():
                            body.extend(chunk)
                            if len(body) > self._max_bytes:
                                raise PageFetchError
                        return bytes(body).decode(response.encoding or "utf-8", errors="replace")
        except (httpx2.HTTPError, httpx2.InvalidURL, LookupError) as exc:
            raise PageFetchError from exc
        raise PageFetchError


def get_page_fetcher(settings: Annotated[Settings, Depends(get_settings)]) -> PageFetcher:
    return HttpPageFetcher(max_bytes=settings.import_max_download_bytes)
