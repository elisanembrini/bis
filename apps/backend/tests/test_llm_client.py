import json

import httpx2
import pytest

from app.services.llm_client import LlmError, OpenAiCompatibleClient

SCHEMA = {"type": "object"}


def client_with(
    handler: httpx2.MockTransport, api_key: str | None = None
) -> OpenAiCompatibleClient:
    return OpenAiCompatibleClient(
        base_url="http://ollama.test:11434/v1/",
        model="llama3.2:3b",
        api_key=api_key,
        transport=handler,
    )


def test_sends_a_strict_schema_request_and_returns_the_content() -> None:
    seen: list[httpx2.Request] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        seen.append(request)
        return httpx2.Response(200, json={"choices": [{"message": {"content": '{"a": 1}'}}]})

    result = client_with(httpx2.MockTransport(handler)).complete_json(
        system="sys", prompt="user", schema=SCHEMA
    )

    assert result == '{"a": 1}'
    request = seen[0]
    assert str(request.url) == "http://ollama.test:11434/v1/chat/completions"
    assert "authorization" not in request.headers
    body = json.loads(request.content)
    assert body["model"] == "llama3.2:3b"
    assert body["temperature"] == 0
    assert body["messages"] == [
        {"role": "system", "content": "sys"},
        {"role": "user", "content": "user"},
    ]
    assert body["response_format"]["json_schema"] == {
        "name": "recipe",
        "strict": True,
        "schema": SCHEMA,
    }


def test_sends_the_api_key_when_configured() -> None:
    seen: list[httpx2.Request] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        seen.append(request)
        return httpx2.Response(200, json={"choices": [{"message": {"content": "{}"}}]})

    client_with(httpx2.MockTransport(handler), api_key="secret").complete_json(
        system="s", prompt="p", schema=SCHEMA
    )

    assert seen[0].headers["authorization"] == "Bearer secret"


@pytest.mark.parametrize(
    "response",
    [
        httpx2.Response(500),
        httpx2.Response(200, json={"choices": []}),
        httpx2.Response(200, json={"unexpected": True}),
        httpx2.Response(200, content=b"not json"),
    ],
)
def test_failures_become_llm_errors(response: httpx2.Response) -> None:
    transport = httpx2.MockTransport(lambda _: response)

    with pytest.raises(LlmError):
        client_with(transport).complete_json(system="s", prompt="p", schema=SCHEMA)


def test_unreachable_server_becomes_an_llm_error() -> None:
    def handler(_: httpx2.Request) -> httpx2.Response:
        raise httpx2.ConnectError("refused")

    with pytest.raises(LlmError):
        client_with(httpx2.MockTransport(handler)).complete_json(
            system="s", prompt="p", schema=SCHEMA
        )
