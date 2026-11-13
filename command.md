# Команди платформи

Огляд, структура, контури API й адреси — у [README.md](README.md).

---

## Open Server (cmd, від адміністратора)

```bat
osp project use sandbox.local
osp info
osp on Nginx
osp off Nginx
osp status Nginx
osp restart Nginx
osp on MariaDB-11.8
osp status MariaDB-11.8
osp node list
osp use Node-24.22.1
```

Hosts: `127.0.1.32 sandbox.local www.sandbox.local`

---

## Кореневий npm (`D:\Projects\platform`)

```bat
npm install
npm run dev
npm run build
npm run start
npm run typecheck
```

Production після `npm run build`:

```bat
npm run start
npm run start -w web
```

Окремо:

```bat
npm run dev -w api
npm run build -w api
npm run start -w api
npm run typecheck -w api
npm run dev -w web
npm run build -w web
npm run start -w web
npm run check -w web
npm run preview -w web
```

Cursor: **Run Task → `dev`** · **Run and Debug → `API`**

---

## Перевірка

```bat
node -v
npm -v
curl -k https://sandbox.local/
curl -k https://sandbox.local/login
curl http://127.0.0.1:4000/api/v1/auth/me
curl -H "Authorization: Bearer dev-client-key" http://127.0.0.1:4000/api/client/v1/status
curl http://127.0.0.1:5173/
```

---

## MariaDB

```
Host: 127.0.1.19
Port: 3306
User: usr_internal
DB:   db_sandbox
```

Налаштування в `api/.env` (пароль у лапках, якщо є `#`):

```bat
copy api\.env.example api\.env
```

---

## Windows-клієнт (`desktop/`)

```powershell
cd D:\Projects\platform\desktop
Set-ExecutionPolicy -Scope Process Bypass
.\.venv\Scripts\Activate.ps1
python -V
python main.py
pytest -q
```

Новий venv (Python 3.12.10):

```powershell
cd D:\Projects\platform\desktop
pyenv shell 3.12.10
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```
