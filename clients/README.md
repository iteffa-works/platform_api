# Client SDKs

Тонкі клієнти для контуру `/api/client/v1`.

Цикл: **отримати роботу → обробити локально → відзвітувати результат**.

| Пакет | Мова |
|-------|------|
| `js/` | JavaScript (ESM) |
| `python/` | Python 3.12 + httpx (`pip install -e clients/python`; його використовує `desktop`) |

Ключ: `CLIENT_API_KEY` (заголовок `Authorization: Bearer …` або `X-Client-Key`).

Сайт (`web`) **не** використовує цей контур — лише `/api/v1`.
