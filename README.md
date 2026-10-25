# Platform

Monorepo: web cabinet, REST API, and Windows desktop client for Telegram contact checks.

| Package | Stack |
|---------|--------|
| `server` | Node.js, Express, Sequelize, MariaDB, JWT |
| `web` | SvelteKit, TypeScript, Fomantic UI |
| `desktop` | Python 3.12, httpx, CustomTkinter (stub), Telethon (planned) |

**Domain (Open Server):** https://sandbox.local/

Ukrainian guide: [README.uk.md](README.uk.md) · Commands: [command.md](command.md)

## Requirements

- Open Server (Nginx, MariaDB, Node via NVM addon)
- Node.js 24+
- Python 3.12.10 (pyenv) for `desktop`

## Quick start

```bat
copy server\.env.example server\.env
npm install
npm run dev
```

API: `http://127.0.0.1:4000/api` · Site: https://sandbox.local/

```powershell
cd desktop
.\.venv\Scripts\Activate.ps1
python main.py
```

## Structure

```
platform/
  server/src/   config · db · models · modules · shared
  web/src/lib/  core · features · shared
  desktop/app/  api · services · ui · workers
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + web |
| `npm run typecheck` | TypeScript / svelte-check |
| `npm run build` | Build web |
| `npm run start` | Start API |

## License

Private.
