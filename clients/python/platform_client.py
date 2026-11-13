"""Тонкий клієнт Client API: отримати → обробити локально → відзвітувати."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

import httpx

WorkHandler = Callable[[dict[str, Any]], dict[str, Any] | Awaitable[dict[str, Any]]]


class ClientApiError(Exception):
    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


class ClientApi:
    def __init__(
        self,
        base_url: str = "http://127.0.0.1:4000/api/client/v1",
        api_key: str = "dev-client-key",
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.Client(
            base_url=self.base_url,
            timeout=timeout,
            headers={"Authorization": f"Bearer {api_key}"},
            verify=False,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> ClientApi:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        response = self._client.request(method, path, **kwargs)
        if response.status_code == 204:
            return None
        data = response.json() if response.content else {}
        if response.is_error:
            message = data.get("error") if isinstance(data, dict) else None
            raise ClientApiError(message or "Помилка запиту", response.status_code)
        return data

    def status(self) -> dict[str, Any]:
        return self.request("GET", "/status")

    def next_work(self) -> dict[str, Any]:
        return self.request("GET", "/work/next")

    def report_result(self, work_id: str, result: dict[str, Any]) -> dict[str, Any]:
        return self.request("POST", f"/work/{work_id}/result", json=result)

    def process_once(self, handler: WorkHandler) -> dict[str, Any]:
        payload = self.next_work()
        work = payload.get("work")
        if not work:
            return {"processed": False, "work": None}
        try:
            result = handler(work)
            if isinstance(result, Awaitable):
                raise TypeError("Використайте sync handler у sync ClientApi")
            self.report_result(work["id"], result)
            return {"processed": True, "work": work, "result": result}
        except Exception as err:
            self.report_result(work["id"], {"status": "failed", "error": str(err)})
            raise
