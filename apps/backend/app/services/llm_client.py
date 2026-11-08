from typing import Annotated, Any, Protocol

import httpx2
from fastapi import Depends
from pydantic import BaseModel, ValidationError

from app.core.config import Settings, get_settings


class LlmError(Exception):
    pass


class LlmClient(Protocol):
    def complete_json(self, *, system: str, prompt: str, schema: dict[str, Any]) -> str: ...


class _Message(BaseModel):
    content: str


class _Choice(BaseModel):
    message: _Message


class _CompletionResponse(BaseModel):
    choices: list[_Choice]


class OpenAiCompatibleClient:
    def __init__(
        self,
        *,
        base_url: str,
        model: str,
        api_key: str | None = None,
        timeout_seconds: float = 120,
        transport: httpx2.BaseTransport | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._api_key = api_key
        self._timeout_seconds = timeout_seconds
        self._transport = transport

    def complete_json(self, *, system: str, prompt: str, schema: dict[str, Any]) -> str:
        headers = {"Authorization": f"Bearer {self._api_key}"} if self._api_key else {}
        body = {
            "model": self._model,
            "temperature": 0,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "recipe", "strict": True, "schema": schema},
            },
        }
        try:
            with httpx2.Client(transport=self._transport, timeout=self._timeout_seconds) as http:
                response = http.post(
                    f"{self._base_url}/chat/completions", json=body, headers=headers
                )
                response.raise_for_status()
                completion = _CompletionResponse.model_validate_json(response.content)
        except (httpx2.HTTPError, ValidationError) as exc:
            raise LlmError from exc
        if not completion.choices:
            raise LlmError
        return completion.choices[0].message.content


def get_llm_client(settings: Annotated[Settings, Depends(get_settings)]) -> LlmClient | None:
    if not settings.llm_base_url or not settings.llm_model:
        return None
    return OpenAiCompatibleClient(
        base_url=settings.llm_base_url,
        model=settings.llm_model,
        api_key=settings.llm_api_key.get_secret_value() if settings.llm_api_key else None,
        timeout_seconds=settings.llm_timeout_seconds,
    )
