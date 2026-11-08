import httpx2
import pytest

from app.services.page_fetcher import HttpPageFetcher, PageFetchError
from app.services.page_text import extract_page_content

PUBLIC = "93.184.216.34"
HTML = {"content-type": "text/html; charset=utf-8"}


def fetcher_for(
    handler: httpx2.MockTransport,
    *,
    addresses: dict[str, list[str]] | None = None,
    max_bytes: int = 1000,
) -> HttpPageFetcher:
    table = addresses or {}
    return HttpPageFetcher(
        max_bytes=max_bytes,
        resolver=lambda host: table.get(host, [PUBLIC]),
        transport=handler,
    )


def ok(body: str = "<p>ciao</p>", headers: dict[str, str] | None = None) -> httpx2.MockTransport:
    return httpx2.MockTransport(
        lambda _: httpx2.Response(200, content=body.encode(), headers=headers or HTML)
    )


def test_downloads_a_public_page() -> None:
    assert fetcher_for(ok()).fetch_html("https://example.com/r") == "<p>ciao</p>"


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com/r",
        "file:///etc/passwd",
        "https:///nohost",
        "https://example.com:8443/r",
        "https://example.com:notaport/r",
    ],
)
def test_rejects_unsupported_urls(url: str) -> None:
    with pytest.raises(PageFetchError):
        fetcher_for(ok()).fetch_html(url)


@pytest.mark.parametrize(
    "address",
    [
        "127.0.0.1",
        "10.0.0.5",
        "192.168.1.10",
        "172.16.0.1",
        "169.254.169.254",
        "0.0.0.0",
        "::1",
        "fe80::1",
        "fc00::1",
        "::ffff:127.0.0.1",
        "not-an-address",
    ],
)
def test_rejects_hosts_that_resolve_to_internal_addresses(address: str) -> None:
    fetcher = fetcher_for(ok(), addresses={"internal.test": [address]})

    with pytest.raises(PageFetchError):
        fetcher.fetch_html("https://internal.test/r")


def test_rejects_a_host_when_any_resolved_address_is_internal() -> None:
    fetcher = fetcher_for(ok(), addresses={"mixed.test": [PUBLIC, "10.0.0.1"]})

    with pytest.raises(PageFetchError):
        fetcher.fetch_html("https://mixed.test/r")


def test_rejects_a_host_that_does_not_resolve() -> None:
    fetcher = fetcher_for(ok(), addresses={"empty.test": []})

    with pytest.raises(PageFetchError):
        fetcher.fetch_html("https://empty.test/r")


def test_follows_a_redirect_to_a_public_page() -> None:
    def handler(request: httpx2.Request) -> httpx2.Response:
        if request.url.path == "/old":
            return httpx2.Response(301, headers={"location": "/new"})
        return httpx2.Response(200, content=b"<p>nuova</p>", headers=HTML)

    assert fetcher_for(httpx2.MockTransport(handler)).fetch_html("https://example.com/old") == (
        "<p>nuova</p>"
    )


def test_rejects_a_redirect_to_an_internal_host() -> None:
    def handler(_: httpx2.Request) -> httpx2.Response:
        return httpx2.Response(302, headers={"location": "http://internal.test/admin"})

    fetcher = fetcher_for(httpx2.MockTransport(handler), addresses={"internal.test": ["127.0.0.1"]})

    with pytest.raises(PageFetchError):
        fetcher.fetch_html("https://example.com/r")


def test_rejects_endless_redirects() -> None:
    def handler(_: httpx2.Request) -> httpx2.Response:
        return httpx2.Response(302, headers={"location": "/again"})

    with pytest.raises(PageFetchError):
        fetcher_for(httpx2.MockTransport(handler)).fetch_html("https://example.com/r")


def test_rejects_a_redirect_without_a_location() -> None:
    transport = httpx2.MockTransport(lambda _: httpx2.Response(302))

    with pytest.raises(PageFetchError):
        fetcher_for(transport).fetch_html("https://example.com/r")


def test_rejects_content_that_is_not_html() -> None:
    transport = ok("{}", headers={"content-type": "application/json"})

    with pytest.raises(PageFetchError):
        fetcher_for(transport).fetch_html("https://example.com/r")


def test_rejects_pages_over_the_size_limit() -> None:
    with pytest.raises(PageFetchError):
        fetcher_for(ok("x" * 2000), max_bytes=1000).fetch_html("https://example.com/r")


@pytest.mark.parametrize("status", [404, 500])
def test_rejects_error_responses(status: int) -> None:
    transport = httpx2.MockTransport(lambda _: httpx2.Response(status, headers=HTML))

    with pytest.raises(PageFetchError):
        fetcher_for(transport).fetch_html("https://example.com/r")


def test_network_failures_are_reported() -> None:
    def handler(_: httpx2.Request) -> httpx2.Response:
        raise httpx2.ConnectError("refused")

    with pytest.raises(PageFetchError):
        fetcher_for(httpx2.MockTransport(handler)).fetch_html("https://example.com/r")


def test_page_text_skips_chrome_and_keeps_the_recipe() -> None:
    html = (
        "<html><head><style>p{}</style><script>var a=1;</script></head><body>"
        "<nav>Menu</nav><header>Sito</header><h1>Torta</h1><p>Mescola  tutto.</p>"
        "<footer>Contatti</footer></body></html>"
    )

    content = extract_page_content(html, 1000)

    assert "Torta Mescola tutto." in content
    for noise in ("Menu", "Sito", "Contatti", "var a"):
        assert noise not in content


def test_page_text_prefers_recipe_structured_data() -> None:
    html = (
        '<script type="application/ld+json">{"@type": "Recipe", "name": "Torta"}</script>'
        "<p>Testo</p>"
    )

    content = extract_page_content(html, 1000)

    assert content.startswith('Structured data: {"@type": "Recipe", "name": "Torta"}')
    assert "Page text: Testo" in content


def test_page_text_ignores_structured_data_that_is_not_a_recipe() -> None:
    html = '<script type="application/ld+json">{"@type": "WebSite"}</script><p>Testo</p>'

    assert extract_page_content(html, 1000) == "Page text: Testo"


def test_page_text_is_truncated() -> None:
    assert len(extract_page_content("<p>" + "a" * 500 + "</p>", 100)) == 100
