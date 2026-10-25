# Команди платформи

Домен: **https://sandbox.local/**  
Стек: TypeScript (`server`, `web`) · Python (`desktop`) · MariaDB · Open Server

---

## Структура

```
platform/
  server/src/
    config/          # env
    db/              # Sequelize
    models/          # сутності + associations
    modules/         # auth | accounts | checks | health
    shared/          # crypto, http, middleware, errors
    types/
  web/src/lib/
    config/
    core/            # api, session
    features/        # auth | accounts | checks
    shared/          # ui, layout, types, utils
  desktop/
    app/             # api, services, ui, workers
    tests/
    main.py
```

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

Hosts (має бути): `127.0.1.32 sandbox.local www.sandbox.local`

---

## Кореневий npm (з `D:\Projects\platform`)

```bat
npm install
npm run dev
npm run build
npm run start
npm run typecheck
```

Окремо:

```bat
npm run dev -w server
npm run start -w server
npm run typecheck -w server
npm run dev -w web
npm run build -w web
npm run check -w web
npm run preview -w web
```

Cursor: **Run Task → `dev`** · **Run and Debug → `API`**

---

## Перевірка Node / API / сайт

```bat
node -v
npm -v
where node
curl -k https://sandbox.local/
curl -k https://sandbox.local/login
curl -k https://sandbox.local/api/health
curl http://127.0.0.1:4000/api/health
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

Налаштування в `server/.env` (пароль у лапках, бо є `#`).

```bat
copy server\.env.example server\.env
```

---

## Windows-клієнт (`desktop/`)

### Активувати venv

```powershell
cd D:\Projects\platform\desktop
Set-ExecutionPolicy -Scope Process Bypass
.\.venv\Scripts\Activate.ps1
python -V
```

### Створити venv заново (Python 3.12.10)

```powershell
cd D:\Projects\platform\desktop
pyenv shell 3.12.10
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

### Запуск / тести / збірка exe

```powershell
python main.py
python -m app
pytest -q
pyinstaller --onefile main.py
```

### Деактивувати venv

```powershell
deactivate
```

---

## Адреси

| Що | URL |
|----|-----|
| Сайт | https://sandbox.local |
| Vite | http://127.0.0.1:5173 |
| API | http://127.0.0.1:4000/api |
| Health | https://sandbox.local/api/health |
| MariaDB | 127.0.1.19:3306 |
