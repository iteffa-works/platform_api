# Platform

Monorepo: web cabinet, REST API, client SDKs, and Windows desktop client.

| Package | Stack |
|---------|--------|
| `api` | Node.js, Express, Sequelize, MariaDB, JWT |
| `web` | SvelteKit, TypeScript, Fomantic UI → `/api/v1` |
| `desktop` | Python 3.12, httpx → `/api/client/v1` |
| `clients/` | Thin JS/Python SDKs for Client API |

**Domain (Open Server):** https://sandbox.local/

Ukrainian guide: [README.uk.md](README.uk.md) · Commands: [command.md](command.md)

## API contours

| Contour | Prefix | Who | Limits |
|---------|--------|-----|--------|
| Platform | `/api/v1` | `web` | none (full platform) |
| Client | `/api/client/v1` | `desktop`, scripts | API key + rate limit; fetch → process locally → report |

## Requirements

- Open Server (Nginx, MariaDB, Node via NVM addon)
- Node.js 24+
- Python 3.12.10 (pyenv) for `desktop`

## Quick start

```bat
copy api\.env.example api\.env
npm install
npm run dev
```

API: `http://127.0.0.1:4000/api/v1` · Client: `http://127.0.0.1:4000/api/client/v1` · Site: https://sandbox.local/

```powershell
cd desktop
.\.venv\Scripts\Activate.ps1
python main.py
```

## Structure

```
platform/
  api/src/      config · core · modules · shared · plugins
  web/src/lib/  core · features · shared
  desktop/app/  api · services · ui · workers
  clients/      js · python
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
