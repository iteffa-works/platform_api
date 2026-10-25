# Платформа

Монорепозиторій: веб-кабінет, REST API та Windows-клієнт для перевірок контактів у Telegram.

| Пакет | Стек |
|-------|------|
| `server` | Node.js, Express, Sequelize, MariaDB, JWT |
| `web` | SvelteKit, TypeScript, Fomantic UI |
| `desktop` | Python 3.12, httpx, CustomTkinter (заглушка), Telethon (план) |

**Домен (Open Server):** https://sandbox.local/

English: [README.md](README.md) · Команди: [command.md](command.md)

## Вимоги

- Open Server (Nginx, MariaDB, Node через NVM)
- Node.js 24+
- Python 3.12.10 (pyenv) для `desktop`

## Швидкий старт

```bat
copy server\.env.example server\.env
npm install
npm run dev
```

API: `http://127.0.0.1:4000/api` · Сайт: https://sandbox.local/

```powershell
cd desktop
.\.venv\Scripts\Activate.ps1
python main.py
```

## Структура

```
platform/
  server/src/   config · db · models · modules · shared
  web/src/lib/  core · features · shared
  desktop/app/  api · services · ui · workers
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
