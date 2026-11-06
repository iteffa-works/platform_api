# Client work API: отримати → обробити → відзвітувати
from __future__ import annotations

from typing import Any

from app.api.client import ApiClient


class WorkApi:
    def __init__(self, client: ApiClient) -> None:
        self._client = client

    def next(self) -> dict[str, Any]:
        return self._client.request("GET", "/work/next")

    def report(self, work_id: str, result: dict[str, Any]) -> dict[str, Any]:
        return self._client.request("POST", f"/work/{work_id}/result", json=result)
