# Заглушка Telegram-воркера
from __future__ import annotations


class TelegramWorker:
    def __init__(self, api_id: int, api_hash: str) -> None:
        self.api_id = api_id
        self.api_hash = api_hash

    def run_once(self) -> None:
        raise NotImplementedError("Telethon-воркер ще не підключено")
