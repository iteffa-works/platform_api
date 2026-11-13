# Platform

Monorepo: web-кабінет, REST API, SDK клієнтів і Windows desktop.

| Пакет | Стек |
|-------|------|
| `api` | Node.js, Express, Sequelize, MariaDB, JWT |
| `web` | SvelteKit, TypeScript → `/api/v1` |
| `desktop` | Python 3.12, httpx → `/api/client/v1` |
| `clients/` | Тонкі JS/Python SDK для Client API |

**Домен (Open Server):** https://sandbox.local/  
Команди: [command.md](command.md)

## Контури API

| Контур | Префікс | Хто | Обмеження |
|--------|---------|-----|-----------|
| Platform | `/api/v1` | `web` | без client-лімітів |
| Client | `/api/client/v1` | `desktop`, скрипти | API key + rate limit |

## Вимоги

- Open Server (Nginx, MariaDB, Node через NVM)
- Node.js 24+ (див. `.nvmrc`)
- Python 3.12.10 (pyenv) для `desktop`

## Швидкий старт

```bat
copy api\.env.example api\.env
npm install
npm run dev
```

| Що | URL |
|----|-----|
| Site | https://sandbox.local |
| Vite | http://127.0.0.1:5173 |
| Platform API | http://127.0.0.1:4000/api/v1 |
| Client API | http://127.0.0.1:4000/api/client/v1 |

Desktop (`desktop/`, SDK `clients/python` ставиться через `requirements.txt`) — див. [command.md](command.md).

## Структура

```
platform/
  api/src/       config · core · modules · shared · plugins
  web/src/lib/   config · core · ui · constructor · blocks · domain · shared  (див. web/src/lib/README.md)
  web/src/routes/[...slug]/   єдиний роут-конструктор
  desktop/app/   api · services · ui · workers
  clients/       js · python
  docs/          outline API
```

Auth на API/web зібрано як **ядро + extensions** (`api/.../auth/extensions`, `web/.../auth/extensions`).

## Скрипти

| Команда | Опис |
|---------|------|
| `npm run dev` | API (tsx watch) + web (Vite) |
| `npm run build` | `api` → `dist/` + `web` → `build/` (adapter-node) |
| `npm run start` | API з `dist/` |
| `npm run start -w web` | Web з `build/` |
| `npm run typecheck` | tsc + svelte-check |

Production: `npm run build`, далі окремо `npm run start` (API) і `npm run start -w web`.

## License

Private.
