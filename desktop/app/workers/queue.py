# Локальна обробка черги перевірок
from __future__ import annotations


class CheckQueueWorker:
    def poll(self) -> None:
        raise NotImplementedError("Черга ще не підключена")
