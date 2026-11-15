# Система

Коротко про все: як влаштовано, де що лежить, як розширювати. Історія змін — [DEVLOG.md](../DEVLOG.md), план — [PLAN.md](../PLAN.md).

## Архітектура

```
web (SvelteKit) ──/api/v1 (cookie-сесія)──▶ api (Express)
desktop / SDK ───/api/client/v1 (ключ)───▶       │
                                                  ▼
                                          MariaDB (Sequelize + міграції)
```

| Контур | Префікс | Хто | Доступ |
|--------|---------|-----|--------|
| Platform | `/api/v1` | web | httpOnly-cookie `sid`, CSRF-заголовок, права ролі |
| Client | `/api/client/v1` | desktop, скрипти | `CLIENT_API_KEY` + rate limit, CORS відкритий |

## API (`api/src`)

| Тека | Що |
|------|----|
| `config/` | змінні середовища |
| `core/access` | рівні прав `none < view < edit < manage`, `can`, `isWithin`, каталог ресурсів |
| `core/activity` | `track(req, userId, action, meta)` → подія `activity` |
| `core/db` | Sequelize, міграції (umzug) |
| `core/events` | шина подій `on` / `emit` |
| `core/plugins` | автозавантаження модулів з `modules/*` (ядро) і `plugins/*` (addon, вмикаються в адмінці) — [docs/plugins](plugins/README.md) |
| `shared/` | crypto (bcrypt, AES-GCM, TOTP, підписані тікети), http (помилки, ліміти, cookies), i18n помилок |
| `modules/` | плагіни (нижче) |

### Плагін

Тека в `modules/` (ядро, завжди увімкнено) або `plugins/` (addon: вмикається в `/admin/plugins` без перезапуску, див. [docs/plugins](plugins/README.md)) з `index.ts`:

```ts
export const plugin: Plugin = {
  name: 'billing',
  contour: 'platform',                       // або 'client'
  permissions: { billing: { label: 'Білінг', levels: ['view', 'manage'] } },
  events: { activity: handler },             // підписки на події
  routes,                                     // (router) => void
};
```

- Ресурси прав з `permissions` автоматично зʼявляються в матриці ролей адмінки.
- Плагіни вантажаться за алфавітом — тому кожен маршрут сам ставить `requireUser` / `requirePermission`.
- Моделі імпортують сервіси; схему задають лише міграції `modules/<name>/migrations/<YYYYMMDD-NN-опис>.ts`.
- Чернетка міграції — `*.draft.ts`: застосовується лише з `MIGRATIONS_DRAFTS=1` (тестова БД під час розробки).

### Модулі

| Модуль | Відповідає за |
|--------|---------------|
| `auth` | користувачі, ролі, сесії, вхід / реєстрація, 2FA, аватари, налаштування, капча (extensions) |
| `cabinet` | власний акаунт: профіль, пароль, налаштування, сесії, 2FA, аватар, реферали, видалення |
| `admin` | користувачі й ролі (CRUD, призначення), показники панелі |
| `activity` | журнал дій (слухає `activity`), власний і загальний |
| `notifications` | сповіщення з подій `activity`, прочитано / ні |
| `billing` | тарифи, рахунок (тариф + баланс), операції балансу |
| `client-api` | черга завдань для desktop (скелет, у памʼяті) |
| `plugins` | список плагінів, увімкнення / вимкнення addon, `GET /plugins` для web |

Addon (`api/src/plugins`): `ispmanager` — хостинг на ISPmanager 6 ([ТЗ](plugins/ispmanager.md)).

## Дані (MariaDB)

| Таблиця | Модуль | Суть |
|---------|--------|------|
| `roles` | auth | `slug`, `name`, `isSystem`, `permissions` (JSON «ресурс → рівень») |
| `users` | auth | `email`, `name`, `passwordHash`, `roleId`, 2FA, `avatar`, `referralCode`, `referredById` |
| `user_preferences` | auth | `theme`, `timezone`, `language`, `antiPhishingCode` |
| `sessions` | auth | `tokenHash` (SHA-256), IP, пристрій, `lastSeenAt`, `expiresAt`, `revokedAt` |
| `activity_log` | activity | `action`, IP, пристрій, `meta` |
| `notifications` | notifications | `kind`, `params`, `readAt` |
| `plans` | billing | ціна в копійках, `isDefault`, `isActive` |
| `billing_accounts` | billing | `userId` → `planId`, `balanceCents` |
| `balance_transactions` | billing | незмінний журнал: сума, баланс після, тип, хто |
| `plugin_states` | plugins | стан addon: `name`, `enabled` |
| `isp_servers` | ispmanager | панелі: URL, логін, пароль (AES-GCM), `verifyTls` |
| `isp_accounts` | ispmanager | `userId` ↔ `panelUser` на сервері, шаблон, стан |
| `migrations` | core | застосовані міграції |

Усі `id` — `INT UNSIGNED AUTO_INCREMENT`; дочірні рядки видаляються каскадом разом з користувачем.

## Доступ і безпека

- **Ролі.** `developer` (системна, одна, усі права `*`, незмінна) і `user` (системна, за замовчуванням). Решта ролей — в адмінці з рівнів прав. Не можна видати права вищі за власні (`isWithin`), змінити свою роль, призначити `developer`. Аварійна передача: `npm run roles:set-developer -w api -- <email>`.
- **Сесії.** Випадковий токен у httpOnly-cookie `sid` (`SameSite=Lax`, `Secure` у production), у БД — лише SHA-256. Вихід і завершення сесії відкликають її одразу; зміна пароля завершує всі інші.
- **CSRF.** Змінюючі запити `/api/v1` — тільки з `X-Requested-With` (чужий сайт не надішле без CORS, а CORS для `/api/v1` закрито).
- **Підбір пароля.** 10 спроб / 15 хв на IP + email; для коду 2FA — на користувача.
- **2FA.** TOTP (RFC 6238), секрет зашифровано AES-GCM (`APP_SECRET`), 8 одноразових кодів відновлення (SHA-256). Вхід: пароль → тікет на 5 хв → код.
- **Аватари.** PNG / JPG / GIF / WebP до 2 МБ, тип за сигнатурою (SVG заборонено), випадкове імʼя файлу в `DATA_DIR/avatars`, `nosniff`.
- **Права в web** — лише для інтерфейсу; перевіряє завжди API.

## Події: журнал і сповіщення

Модуль робить дію → `track(...)` → подія `activity` → `activity` пише в журнал, `notifications` створює сповіщення для ключових дій. Тексти не зберігаються: web перекладає `activity.<action>` / `notification.<kind>` з параметрами.

## Білінг

Гроші — цілі копійки (`12.50` ↔ `1250`). Рух балансу — в транзакції з блокуванням рядка, мінус не допускається. Платний тариф — разове списання ціни при переході. Платіжного шлюзу немає: поповнює адміністратор (`/admin/billing`), користувач отримує сповіщення.

## Web (`web/src/lib`)

| Тека | Що |
|------|----|
| `core/` | HTTP-клієнт `/api/v1` (cookie, CSRF, Accept-Language), синхронізація налаштувань з акаунтом |
| `i18n/` | uk (еталон) / en / ru; ключі типізовані — невідомий ключ = помилка svelte-check |
| `domain/` | `auth` (користувач, `can`, розширення форми), `theme` |
| `constructor/` | реєстр сторінок / блоків / навігації з плагінів, `PageHost`, перевірка доступу |
| `plugins/` | ядро: `site` (лендинг), `auth`, `cabinet`, `admin` |

Addon — `web/src/plugins/<name>` з `export const plugin`, підхоплюються автоматично й діють, поки однойменний API-плагін увімкнено.
| `ui/` | UI-kit: elements → components → patterns → templates, токени тем |

### Web-плагін

```ts
export const admin: WebPlugin = {
  name: 'admin',
  blocks: { 'admin.roles': RolesPanelBlock },
  nav: [{ href: '/admin/roles', label: 'nav.roles', icon: 'key', group: 'nav.group.access', permission: ['roles', 'view'] }],
  header: [],                          // блоки в шапці шаблону (кабінет: баланс, дзвіночок)
  pages: [{ id: 'admin-roles', path: '/admin/roles', access: 'user', permission: ['roles', 'view'],
            template: 'admin', title: 'nav.roles', load: loadRolesPage, slots: { default: [{ block: 'admin.roles' }] } }],
};
```

Підключення — рядок у `plugins/index.ts`; файлів у `routes/` не треба (один `routes/[...slug]`).

### Тема й мова

Обидві — cookie (`theme`, `lang`) для SSR без мерехтіння + поле в `user_preferences`. Після входу значення з акаунта має пріоритет; якщо в акаунті порожньо — туди зберігається вибір пристрою. Повідомлення API приходять мовою з `Accept-Language`.

### SSR

Публічні сторінки (лендинг, вхід) рендеряться на сервері потрібною мовою й темою. Захищені — в браузері: стани користувача — модульні store, тож на сервері їх не можна ділити між запитами.

## API: маршрути

| Група | Маршрути |
|-------|----------|
| auth | `POST /auth/register` `{email,password,ref?}` · `POST /auth/login` → `{user}` або `{twoFactor,ticket}` · `POST /auth/login/2fa` · `POST /auth/logout` · `GET /auth/session` (гість → `{user:null}`) · `GET /auth/me` · `GET /auth/captcha` · `GET /avatars/:file` |
| cabinet | `GET /cabinet/profile` · `PATCH /cabinet/account` · `DELETE /cabinet/account` · `PATCH /cabinet/preferences` · `POST /cabinet/password` · `GET\|DELETE /cabinet/sessions[/:id]` · `POST /cabinet/2fa/setup\|enable\|disable` · `PUT\|DELETE /cabinet/avatar` (тіло — файл) · `GET /cabinet/referrals` · `GET /cabinet/activity` · `GET /cabinet/notifications` · `POST /cabinet/notifications/read` · `GET /cabinet/billing[/summary]` · `POST /cabinet/billing/plan` |
| admin | `GET /admin/overview` · `GET /admin/users` · `PATCH /admin/users/:id` · `GET /admin/permissions` · `GET\|POST /admin/roles` · `PATCH\|DELETE /admin/roles/:id` · `GET /admin/activity` · `GET /admin/billing` · `POST /admin/billing/adjust` · `POST\|PATCH\|DELETE /admin/billing/plans[/:id]` |
| plugins | `GET /plugins` (публічно, `{enabled}`) · `GET /admin/plugins` · `PATCH /admin/plugins/:name` `{enabled}` |
| ispmanager | `/admin/ispmanager/servers…`, `/admin/ispmanager/accounts…`, `/cabinet/hosting…` — [ТЗ](plugins/ispmanager.md) |
| client | `GET /status` · `GET /work/next` · `POST /work/:id/result` |

Помилки: `{ error }` з HTTP-статусом; 401 — немає сесії, 403 — прав / CSRF, 429 — ліміт.

## Середовище (`api/.env`)

| Змінна | За замовчуванням | Що |
|--------|------------------|----|
| `PORT` | 4000 | порт API |
| `APP_SECRET` | — (обовʼязковий у production) | підписи тікетів, шифрування секретів 2FA |
| `APP_TITLE` | Platform | назва в застосунку 2FA |
| `SESSION_TTL_DAYS` | 30 | життя сесії |
| `DATA_DIR` | `api/data` | файли (аватари), у `.gitignore` |
| `CURRENCY` | UAH | валюта балансу |
| `CLIENT_API_KEY`, `CLIENT_RATE_LIMIT_PER_MINUTE` | dev-client-key, 120 | Client API |
| `DB_*` | Open Server | MariaDB |
| `AUTH_CAPTCHA`, `AUTH_FORM` | true | auth-розширення |
| `MIGRATIONS_DRAFTS` | — | `1` — застосовувати `*.draft.ts` (лише тестова БД) |

## Перевірки

`npm run typecheck` (tsc + svelte-check з типізованими ключами перекладів) · `npm test -w api` (vitest: права, TOTP, гроші, id, відповіді ISPmanager).
