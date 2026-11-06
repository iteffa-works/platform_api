from app.config import settings


def test_api_base() -> None:
    assert settings.api_base.endswith("/api/client/v1")
