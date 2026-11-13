from app.api import create_client
from app.config import settings


def test_api_base() -> None:
    assert settings.api_base.endswith("/api/client/v1")


def test_client_uses_settings() -> None:
    with create_client() as client:
        assert client.base_url == settings.api_base.rstrip("/")
        assert client.api_key == settings.client_api_key
