# Checks API
from __future__ import annotations

from typing import Any

from app.api.client import ApiClient


class ChecksApi:
    def __init__(self, client: ApiClient) -> None:
        self._client = client

    def list(self) -> dict[str, Any]:
        return self._client.request("GET", "/checks")

    def create(self, queries: str, account_id: str | None = None) -> dict[str, Any]:
        body: dict[str, Any] = {"queries": queries}
        if account_id:
            body["accountId"] = account_id
        return self._client.request("POST", "/checks", json=body)

    def get(self, check_id: str) -> dict[str, Any]:
        return self._client.request("GET", f"/checks/{check_id}")
