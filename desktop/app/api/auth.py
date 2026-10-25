# Auth API
from __future__ import annotations

from typing import Any

from app.api.client import ApiClient


class AuthApi:
    def __init__(self, client: ApiClient) -> None:
        self._client = client

    def login(self, email: str, password: str) -> dict[str, Any]:
        return self._client.request("POST", "/auth/login", json={"email": email, "password": password})

    def me(self) -> dict[str, Any]:
        return self._client.request("GET", "/auth/me")
