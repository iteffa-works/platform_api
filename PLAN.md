# План реалізації платформи (local → власний сервер)

Мета: довести функціонал екрана входу / кабінету / сервісів до робочого стану  
**спочатку локально** (Open Server + `sandbox.local`), потім — на власному сервері.

Стек уже в репо: `api` (Express + MariaDB + JWT), `web` (SvelteKit), `desktop` / `clients` (Client API).

---

## Принципи

| # | Правило |
|---|--------|
| 1 | Local-first: жоден продакшен-деплой, доки feature не працює на `sandbox.local` |
| 2 | Один сервіс за раз: UI-картка → stub API → реальна логіка → документи |
| 3 | Auth extensions уже є — розширюємо, не переписуємо ядро |
| 4 | Секрети лише в `.env` / vault на сервері, ніколи в git |
| 5 | Контури: Platform `/api/v1` (web) і Client `/api/client/v1` (desktop) |

---

## Фази

### Фаза 0 — Локальний фундамент (зараз)

**Статус:** частково готово.

- [x] Monorepo `api` + `web`, `npm run dev`
- [x] Auth UI (login/register), captcha, extensions
- [x] JWT login/register/me, accounts, admin users
- [x] Open Server → Vite `:5173`, API `:4000`
- [ ] Стабільний `api/.env` з MariaDB, міграції/sync моделей задокументовані
- [ ] `npm run build` + `npm run start` (API dist + web adapter-node) перевірені локально
- [ ] Чекліст smoke: register → login → `/app` → `/admin`

**Критерій готовності:** чистий clone → `copy .env` → `npm i` → `npm run dev` → повний auth-флоу без ручних костилів.

---

### Фаза 1 — Auth до «продакшен-готового» локально

| Крок | Що | Де |
|------|----|-----|
| 1.1 | Реальні forgot-email / forgot-password (хоча б stub-лист у лог / Mailhog) | `api` + `web` extensions |
| 1.2 | Passwordless (magic link) — local only | `AUTH_PASSWORDLESS` |
| 1.3 | OAuth stubs → реальні провайдери (Google, Microsoft, Facebook) з `.env` | `api/modules/auth/extensions` |
| 1.4 | Passkey / WebAuthn (локально через HTTPS `sandbox.local`) | окреме extension |
| 1.5 | Rate limit + lockout на login/register | `api` middleware |
| 1.6 | Terms / verification / account-type — збереження в БД | models + hooks |

**Критерій:** усі кнопки SSO або працюють, або явно `відключено` без фейкового UX.

---

### Фаза 2 — Кабінет і доменні модулі (local stubs → API)

Ліві картки promo — це **каталог продуктів**. Реалізація по пріоритету:

#### Хвиля A — ядро кабінету

| Сервіс | Local MVP |
|--------|-----------|
| Identity | Ролі, сесії, audit log (таблиця + admin UI) |
| Secrets | CRUD секретів у БД (шифрування `APP_SECRET`), без HashiCorp спочатку |
| Observability | Health `/api/v1/health`, прості логи в файл/БД |
| Helpdesk | Тикети CRUD у кабінеті (stub) |

#### Хвиля B — інфраструктура (Docker Compose локально)

| Сервіс | Local стек |
|--------|------------|
| Object Storage | MinIO |
| Databases | окремі контейнери Postgres/MySQL **або** схеми в існуючій MariaDB + UI |
| Compute | Docker API / docker-compose projects per tenant (обмежений MVP) |
| Pipelines | Gitea Actions / локальний runner **або** stub job queue |
| Edge CDN | Nginx cache vhost (пізніше) |

#### Хвиля C — продукт / growth

| Сервіс | Local MVP |
|--------|-----------|
| API Gateway | Маршрути плагінів + API keys уже в Client contour |
| Web Apps | Deploy stub: static → Nginx root / Svelte build |
| DNS | Лише UI + записи в БД (без реального BIND спочатку) |
| Messaging | Черга + webhook stubs |
| Workflows | Job table + worker (`desktop` / node worker) |
| Mail Delivery | Mailhog / SMTP з `.env` |
| Analytics / Growth | Події в БД + прості звіти |
| Connectors | OAuth apps registry |

**Правило хвиль:** для кожного сервісу спочатку:

1. Сторінка/блок у `web` (constructor)
2. `api` module + routes під `/api/v1/...`
3. Feature flag / `enabled` у конфігу
4. Запис у `docs/` (короткий контракт API)

---

### Фаза 3 — Client contour і desktop

- [ ] Розширити `/api/client/v1` під реальні work-items
- [ ] Desktop: логін API-ключем, виконання задач, репорт
- [ ] SDK у `clients/js` і `clients/python` синхронно з API

---

### Фаза 4 — Власний сервер (після стабільного local)

#### 4.1 Підготовка сервера

| Компонент | Рекомендація |
|-----------|--------------|
| OS | Ubuntu LTS |
| Runtime | Node 24 (як `.nvmrc`) |
| DB | MariaDB / MySQL |
| Reverse proxy | Nginx + TLS (Let’s Encrypt) |
| Process | systemd **або** Docker Compose |
| Secrets | `.env` з правами `600` / потім Vault |

#### 4.2 Деплой-пайплайн

```text
git pull
npm ci
npm run build          # api → dist/, web → build/
npm run start          # API
npm run start -w web   # SvelteKit adapter-node
# Nginx → proxy_pass web :3000, /api → api :4000
```

#### 4.3 Чекліст перед продом

- [ ] `APP_SECRET` унікальний, не `dev`
- [ ] CORS / cookies лише для свого домену
- [ ] HTTPS обовʼязковий (Passkey / OAuth)
- [ ] Бекапи MariaDB + MinIO
- [ ] Моніторинг health + диск
- [ ] Rate limits увімкнені
- [ ] OAuth redirect URIs = прод-домен

#### 4.4 Що **не** тягнути на сервер, доки local не зелений

- Повноцінний CDN / multi-region
- Справжній DNS-провайдер
- Кластер Kubernetes
- Публічний Client API без жорстких лімітів

---

## Локальний контур (щоденна робота)

```bat
copy api\.env.example api\.env
npm install
npm run dev
```

| Що | URL |
|----|-----|
| UI | https://sandbox.local або http://127.0.0.1:5173 |
| Platform API | http://127.0.0.1:4000/api/v1 |
| Client API | http://127.0.0.1:4000/api/client/v1 |
| MariaDB | з `api/.env` |

Команди: [command.md](command.md) · API outline: [docs/openapi-outline.md](docs/openapi-outline.md)

Опційно для хвилі B:

```bash
# майбутнє: docker-compose.yml у корені
# minio, mailhog, extra db
docker compose up -d
```

---

## Порядок робіт (найближчі 2–4 тижні)

1. **Закрити Фазу 0** — smoke auth + build/start  
2. **Фаза 1.5–1.6** — rate limit, збереження terms/accountType у БД  
3. **Хвиля A** — Identity audit + Secrets CRUD + Helpdesk stub  
4. **Mailhog + forgot password**  
5. **OAuth Google** (один провайдер end-to-end)  
6. **docker-compose**: MinIO → Object Storage UI  
7. Лише після цього — чорновий деплой на VPS (Фаза 4)

---

## Структура коду під ріст

```text
api/src/modules/
  auth/          # ядро + extensions (є)
  accounts/      # є
  admin/         # є
  client-api/    # є
  identity/      # далі
  secrets/       # далі
  storage/       # далі (MinIO)
  ...

web/src/lib/
  blocks/        # UI-блоки конструктора
  domain/        # клієнтська логіка по модулях
  constructor/   # pages[] — нові екрани без нових routes-файлів
```

Кожен новий сервіс = `api` module + `web` domain/blocks + рядок у `pages.ts` + прапорець у конфігу.

---

## Ризики

| Ризик | Мітигація |
|-------|-----------|
| Занадто широкий scope 18 сервісів | Хвилі A→B→C, stub UI до API |
| OAuth без HTTPS | Лише `sandbox.local` TLS / потім прод HTTPS |
| Секрети в репо | `.gitignore`, `.env.example` без значень |
| Важкий Compute на shared host | Local Docker; на сервері — окремий ліміт / черга |

---

## Definition of Done (локально)

- [ ] Register / login / logout / me
- [ ] Captcha + terms на register
- [ ] Кабінет `/app` з реальними даними хоча б 1 модуля хвилі A
- [ ] Admin `/admin` змінює ролі
- [ ] `npm run build && npm run start` (+ web start) без помилок
- [ ] Короткий запис у `docs/` для кожного увімкненого API

## Definition of Done (власний сервер)

- [ ] HTTPS домен
- [ ] API + web під Nginx
- [ ] Автобекап БД
- [ ] Health-check моніторинг
- [ ] OAuth/Passkey лише якщо потрібні в проді й протестовані локально

---

*Документ живий: оновлювати статуси чекбоксів після кожної хвилі.*
