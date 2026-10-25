# HTTP-клієнт до /api
from __future__ import annotations

from typing import Any

import httpx

from app.config import settings


class ApiError(Exception):
    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


class ApiClient:
    def __init__(self, base_url: str | None = None, token: str | None = None) -> None:
        self.base_url = (base_url or settings.api_base).rstrip("/")
        self.token = token
        self._client = httpx.Client(
            base_url=self.base_url,
            timeout=settings.request_timeout,
            verify=False,
        )

    def set_token(self, token: str | None) -> None:
        self.token = token

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> ApiClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        headers = dict(kwargs.pop("headers", {}) or {})
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        response = self._client.request(method, path, headers=headers, **kwargs)
        if response.status_code == 204:
            return None
        data = response.json() if response.content else {}
        if response.is_error:
            message = data.get("error") if isinstance(data, dict) else None
            raise ApiError(message or "Помилка запиту", response.status_code)
        return data

    def health(self) -> dict[str, Any]:
        return self.request("GET", "/health")
