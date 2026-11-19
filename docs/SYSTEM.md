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
| `flowaxy/` | **ядро-фреймворк** (незалежне, згодом — npm-пакети): нічого не імпортує з решти `src` (перевірка — `tsconfig.flowaxy.json` у `npm run typecheck`) |
| `flowaxy/access` | рівні прав `none < view < edit < manage`, `can`, `isWithin`, каталог ресурсів |
| `flowaxy/activity` | `track(req, userId, action, meta)` → подія `activity` |
| `flowaxy/db` | Sequelize (підключення — змінні `DB_*`), міграції (umzug) |
| `flowaxy/events` · `flowaxy/hooks` | шина подій; дії (`doAction`) і фільтри (`applyFilters`) з пріоритетами |
| `flowaxy/services` | **порти**: `provide` / `use` — звʼязок плагінів без імпортів (`wallet`, `users`, `access`, `notifications`); вимкнений власник → 503 |
| `flowaxy/ui` | server-driven UI: схема вузлів, реєстр сторінок, маніфест, переклади мовою запиту; кит таблиць (`gridQuery`, `datagrid`, `person`…) з вбудованими перекладами; огляди з внесків плагінів (`ui.dashboard`) |
| `flowaxy/plugins` | завантаження розширень і плагінів, стан, маршрути за «воротами» — [docs/plugins](plugins/README.md) |
| `flowaxy/settings.ts` | `configure({ extensionsDir, pluginsDir })` — застосунок каже ядру, де його теки; `errors.ts`, `fs.ts` |
| `env.ts` · `paths.ts` | точки входу: `.env` і `configure()` — імпортувати першими (сервер `index.ts`, `cli/migrate.ts`) |
| `config/` | налаштування застосунку (порт, секрет, сесії, валюта) |
| `shared/` | спільне застосунку: crypto, http (ліміти, cookies; `HttpError` — з ядра), i18n помилок, гроші |
| `extensions/` | **розширення** — системний функціонал, завжди діють (нижче) |
| `plugins/` | **плагіни** — вмикаються / вимикаються в `/admin/plugins` без перезапуску (нижче) |

### Розширення й плагіни

Тека в `extensions/` (завжди діє) або `plugins/` (вмикається в адмінці, див. [docs/plugins](plugins/README.md)) з `index.ts`:

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
- Спершу розширення, потім плагіни (за алфавітом). Маршрути ставлять перевірки доступу самі — через порт: `guards.user`, `guards.permission(…)` з `flowaxy/services`.
- Плагіни один одного не імпортують: звʼязок — порти й хуки. Плагін владіє своїми екранами (REST і сторінки адмінки / кабінету своїх даних).
- Моделі імпортують сервіси; схему задають лише міграції `<extensions|plugins>/<name>/migrations/<YYYYMMDD-NN-опис>.ts`.
- Чернетка міграції — `*.draft.ts`: застосовується лише з `MIGRATIONS_DRAFTS=1` (тестова БД під час розробки).

### Склад

| | Назва | Відповідає за |
|-|-------|---------------|
| плагін | `auth` | користувачі, ролі, сесії, вхід / реєстрація, 2FA, аватари, налаштування, капча (`plugins/auth/extensions`); «мій акаунт» (`/cabinet/*`); адмінка користувачів і ролей; порти `access`, `users` |
| плагін | `admin` | доступ до адмінки (`admin.panel`, шлюз `/admin/*`), панель-огляд з внесків плагінів, керування плагінами |
| плагін | `activity` | журнал дій (слухає `activity`), власний і загальний; сторінка й віджет адмінки |
| плагін | `notifications` | сповіщення з подій `activity`, прочитано / ні |
| плагін | `billing` | баланс для оплати послуг, поповнення заявками (на картку / банківський переказ) з підтвердженням адміном, реквізити, журнал операцій; порт `wallet` |
| плагін | `client-api` | черга завдань для desktop (скелет, у памʼяті) |
| розширення | `plugins` | список, увімкнення / вимкнення плагінів, `GET /plugins` для web |
| розширення | `ui` | `GET /ui/manifest` (маршрути, меню, сервіси, переклади), `POST /ui/page` (схема сторінки плагіна) |
| плагін | `hosting` | хостинг, копія даних панелі з синхронізацією, провайдер ISPmanager 6 — еталонна структура плагіна ([опис](plugins/hosting/hosting.md)) |

## Дані (MariaDB)

| Таблиця | Модуль | Суть |
|---------|--------|------|
| `roles` | auth | `slug`, `name`, `isSystem`, `permissions` (JSON «ресурс → рівень») |
| `users` | auth | `email`, `name`, `passwordHash`, `roleId`, 2FA, `avatar`, `referralCode`, `referredById` |
| `user_preferences` | auth | `theme`, `timezone`, `language`, `antiPhishingCode` |
| `sessions` | auth | `tokenHash` (SHA-256), IP, пристрій, `lastSeenAt`, `expiresAt`, `revokedAt` |
| `activity_log` | activity | `action`, IP, пристрій, `meta` |
| `notifications` | notifications | `kind`, `params`, `readAt` |
| `billing_accounts` | billing | `userId`, `balanceCents` |
| `billing_topups` | billing | заявки на поповнення: спосіб, сума, призначення `FX-…`, стан |
| `billing_settings` | billing | реквізити (картка, IBAN), мінімальна сума |
| `balance_transactions` | billing | незмінний журнал: сума, баланс після, тип, хто |
| `plugin_states` | plugins | стан плагінів: `name`, `enabled` |
| `hosting_servers` | hosting | панелі: провайдер, URL, логін, пароль (AES-GCM), `verifyTls`, країна, IP |
| `hosting_plans` | hosting | ціна за місяць → шаблон панелі |
| `hosting_accounts` | hosting | `userId` ↔ логін панелі, стан, `paidUntil`, `autoRenew`, використання |
| `migrations` | flowaxy | застосовані міграції |

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

Плагіни (addon) коду в web не мають: сторінки описує API (`plugin.ui`), рендерить `constructor/remote` (маніфест → `RemotePage` → `UiNode`). Див. [docs/plugins](plugins/README.md).
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
| ui | `GET /ui/manifest` (гість — без сторінок) · `POST /ui/page` `{path, state}` → `{nodes}` |
| plugins | `GET /plugins` (публічно, `{enabled}`) · `GET /admin/plugins` · `PATCH /admin/plugins/:name` `{enabled}` |
| hosting | `/cabinet/hosting…` (ресурси акаунта — `/cabinet/hosting/:id/panel/{sites,dns,mail,databases,ftp,ssl,cron}`), `/admin/hosting/{servers,plans,accounts,stats}…` (сервер: `sync`, `overview`, `users`) — [опис](plugins/hosting/hosting.md) |
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
| `HOSTING_JOB_INTERVAL_MINUTES` | 15 | фонове завдання хостингу (строки, блокування) |
| `HOSTING_DELETE_AFTER_DAYS` | 0 | видаляти в панелі заблоковані за несплату через N днів; 0 — ніколи |
| `MIGRATIONS_DRAFTS` | — | `1` — застосовувати `*.draft.ts` (лише тестова БД) |

## Перевірки

`npm run typecheck` (tsc + svelte-check з типізованими ключами перекладів) · `npm test -w api` (vitest: права, TOTP, гроші, id, відповіді ISPmanager, правила хостингу).
