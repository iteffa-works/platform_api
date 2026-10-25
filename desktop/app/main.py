# Запуск desktop-клієнта
from __future__ import annotations

from app.api import ApiClient
from app.config import settings
from app.ui.app import build_app


def run() -> None:
    with ApiClient() as client:
        try:
            health = client.health()
            print(f"API {settings.api_base} → {health}")
        except Exception as err:  # noqa: BLE001
            print(f"API недоступне: {err}")
    build_app()
