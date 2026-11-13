# Запуск desktop-клієнта
from __future__ import annotations

from app.api import create_client
from app.config import settings
from app.ui.app import build_app


def run() -> None:
    with create_client() as client:
        try:
            status = client.status()
            print(f"Client API {settings.api_base} → {status}")
        except Exception as err:  # noqa: BLE001
            print(f"Client API недоступне: {err}")
    build_app()
