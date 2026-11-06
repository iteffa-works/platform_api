# Платформа

Монорепозиторій: веб-кабінет, REST API, клієнтські SDK та Windows-клієнт.

| Пакет | Стек |
|-------|------|
| `api` | Node.js, Express, Sequelize, MariaDB, JWT |
| `web` | SvelteKit, TypeScript, Fomantic UI → `/api/v1` |
| `desktop` | Python 3.12, httpx → `/api/client/v1` |
| `clients/` | Тонкі JS/Python SDK для Client API |

**Домен (Open Server):** https://sandbox.local/

English: [README.md](README.md) · Команди: [command.md](command.md)

## Контури API

| Контур | Префікс | Хто | Обмеження |
|--------|---------|-----|-----------|
| Platform | `/api/v1` | `web` | немає (повний доступ платформи) |
| Client | `/api/client/v1` | `desktop`, скрипти | API key + rate limit; отримати → обробити локально → відзвітувати |

## Вимоги

- Open Server (Nginx, MariaDB, Node через NVM)
- Node.js 24+
- Python 3.12.10 (pyenv) для `desktop`

## Швидкий старт

```bat
copy api\.env.example api\.env
npm install
npm run dev
```

API: `http://127.0.0.1:4000/api/v1` · Client: `http://127.0.0.1:4000/api/client/v1` · Сайт: https://sandbox.local/

```powershell
cd desktop
.\.venv\Scripts\Activate.ps1
python main.py
```

## Структура

```
platform/
  api/src/      config · core · modules · shared · plugins
  web/src/lib/  core · features · shared
  desktop/app/  api · services · ui · workers
  clients/      js · python
```

## Скрипти

| Команда | Опис |
|---------|------|
| `npm run dev` | API + веб |
| `npm run typecheck` | TypeScript / svelte-check |
| `npm run build` | Збірка веб |
| `npm run start` | Запуск API |

## Ліцензія

Приватний проєкт.
