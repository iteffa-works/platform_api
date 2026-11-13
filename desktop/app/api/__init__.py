# Client API (/api/client/v1) через SDK clients/python
from __future__ import annotations

from platform_client import ClientApi, ClientApiError

from app.config import settings


def create_client() -> ClientApi:
    return ClientApi(
        base_url=settings.api_base,
        api_key=settings.client_api_key,
        timeout=settings.request_timeout,
    )


__all__ = ["ClientApi", "ClientApiError", "create_client"]
