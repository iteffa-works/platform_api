# Конфіг клієнта (Client API)
from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True, slots=True)
class Settings:
    api_base: str = os.getenv("API_BASE", "https://sandbox.local/api/client/v1")
    client_api_key: str = os.getenv("CLIENT_API_KEY", "dev-client-key")
    request_timeout: float = float(os.getenv("REQUEST_TIMEOUT", "30"))
    app_name: str = "Platform Desktop"


settings = Settings()
