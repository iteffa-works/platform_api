# Точка входу UI
from __future__ import annotations

from app.config import settings


def build_app() -> None:
    print(f"{settings.app_name} UI — заглушка")
