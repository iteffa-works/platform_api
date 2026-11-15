# Плагін «Хостинг» (`api/src/plugins/hosting`) — еталон плагіна

Хостинг як послуга: тарифи, замовлення й продовження з балансу, керування акаунтами
і **повна консоль панелі** в адмінці. Панелі — провайдери: **ISPmanager 6** (робочий) і **Sandbox** (технічний).
Інтерфейс — server-driven UI ([README](README.md)): у web коду плагіна немає.

## 1. Структура

```
hosting/
  index.ts            маніфест плагіна (тонкий): права, ui, маршрути, init
  module.ts           HostingModule — корінь композиції: створює й звʼязує сервіси
  config.ts           HostingConfig — налаштування (env)
  hooks.ts            типи хуків (declaration merging) + підписники: журнал, сповіщення
  domain/
    models.ts         Sequelize: HostingServer, HostingPlan, HostingAccount
    rules.ts          чисті правила: логін, пароль, домен, cron, дати, доплата (+ rules.test.ts)
    url.ts            нормалізація http(s)-адреси панелі
  providers/
    contracts.ts      контракт PanelClient: accounts, sites, dns, mail, databases, ftp, ssl, cron, system
    registry.ts       ProviderRegistry (id → провайдер)
    ispmanager6/      transport.ts (HTTP, сесія), mapper.ts, resources/*.ts (клас на розділ), provider.ts
    sandbox/          store.ts (памʼять + JSON), provider.ts — технічна панель
  services/           класи бізнес-логіки
    server.service    сервери: облік, підключення, перевірка, шаблони, діагностика
    plan.service      тарифи
    account.service   акаунти: адмінські дії й дії власника
    order.service     замовлення, продовження, зміна тарифу — гроші (billing)
    panel.service     консоль панелі: усі розділи, зміни → хук журналу
    lifecycle.service фонове завдання: строки, блокування, самовідновлення
    presenter.ts      подання моделей без секретів;  panel-call.ts — PanelError → 502
  http/               guards.ts (права, параметри) + admin / panel / cabinet .routes.ts
  ui/                 kit.ts (конструктори вузлів), format.ts, messages/, pages/admin/*, pages/admin/console/*, pages/cabinet/*
  migrations/  cli/probe.ts
```

**Правило:** маршрут лише читає запит і викликає метод сервісу; сервіс не знає про HTTP-відповідь і журнал —
оголошує подію хуком; побічні ефекти — у підписниках (`hooks.ts`). Провайдер не знає про БД і гроші.

## 2. Провайдери

| | ISPmanager 6 | Sandbox |
|-|--------------|---------|
| Адреса | `https://host:1500` (суфікс `/ispmgr` прибирається) | `sandbox://<імʼя>` |
| Стан | реальна панель (POST `out=json`, сесія з повторним входом) | памʼять + `DATA_DIR/hosting-sandbox/*.json`, демо-дані |
| Для чого | продакшен | розробка UI, тести без сервера |
| Збої | помилки панелі | пароль `wrong` — вхід; імʼя з `fail` — помилка створення; затримка 30–120 мс |

Нова панель: клас з `HostingProvider` + `PanelClient` (розділи можна наслідувати від базового класу, як `IspResource`),
рядок у `createProviderRegistry()`. Сервіси, сторінки й білінг не змінюються.

### ISPmanager 6 — відповідність функцій

| Розділ | Функції панелі |
|--------|----------------|
| Користувачі | `user`, `user.edit`, `user.suspend` / `resume`, `user.delete`, `preset`, `session.newkey` (вхід без пароля) |
| Сайти | `webdomain`, `webdomain.edit`, `webdomain.delete` |
| DNS | `domain`, `domain.edit` / `delete`, `domain.record`, `domain.record.edit` / `delete` |
| Пошта | `emaildomain(.edit/.delete)` (`ipsrc` — перша IP з форми), `email(.edit/.delete)` |
| БД | `db`, `db.edit` (новий користувач `user=*`), `db.delete` (ключ `імʼя->сервер`) |
| FTP / SSL / cron | `ftp.user(.edit/.delete)`, `sslcert`, `scheduler(.edit/.delete)` (режим expert) |
| Система | `whoami`, `license.info`, `sysinfo`, `services`, `ipaddrlist`, `phpversions` |

Особливості, перевірені на 6.155: у режимі `su` списки не мають колонки `owner`; `quota_used` / `quota_total` — МіБ (0 — без ліміту).

## 3. Адмінка

| Сторінка | Що |
|----------|----|
| `/admin/hosting` | огляд: активні / заблоковані / закінчуються, дохід за місяць, сервери, найближчі строки |
| `/admin/hosting/accounts` | акаунти платформи: фільтр стану, пошук, створення / привʼязка (модальне вікно), строк, вхід від імені, блокування, видалення |
| `/admin/hosting/servers` | сервери: підключення (ISPmanager / Sandbox), перевірка, вмикання |
| `/admin/hosting/servers/:id` | **консоль панелі**: Огляд · Користувачі · Сайти · DNS (зони й записи) · Пошта · Бази даних · FTP · SSL · Cron · Налаштування; фільтр власника `?owner=` |
| `/admin/hosting/plans` | тарифи: ціна → шаблон панелі |

Права: перегляд — `hosting:view`, зміни — `hosting:manage` (+ `admin.panel:view`). Кожна зміна в консолі — у журналі дій.

## 4. Гроші (billing)

| Дія | Правило |
|-----|---------|
| Замовлення | ціна (фільтр `hosting.order.price`) × місяці; списання й `pending` — одна транзакція; панель відмовила → refund |
| Продовження | + місяці від `paidUntil` або сьогодні; рядок акаунта блокується |
| Зміна тарифу | доплата `(нова − стара) × залишок_днів / 30`; дешевший — без повернення; збій панелі → refund |
| Автопродовження / несплата | фонове завдання: списати за місяць або заблокувати; оплата → розблокування |
| Видалення за несплату | лише `HOSTING_DELETE_AFTER_DAYS` > 0 |

## 5. Хуки (інтеграція з іншими модулями)

| Дія | Коли |
|-----|------|
| `hosting.account.created` `{account, source}` | замовлення / адмінка |
| `hosting.account.renewed` `{months, automatic}` · `plan_changed` `{plan, costCents}` | оплата |
| `hosting.account.suspended` `{reason}` · `resumed` · `deleted` · `updated` · `expiring` | життєвий цикл |
| `hosting.account.panel_login` · `password_changed` | дії власника |
| `hosting.panel.changed` `{serverId, section, action, name}` | зміна в консолі панелі |

| Фільтр | Значення |
|--------|----------|
| `hosting.order.price` | ціна в копійках `{plan, months, userId, kind}` — знижки, промокоди, акції |

Підписники за замовчуванням (`hooks.ts`): журнал дій і сповіщення. Інший модуль підписується так само:
`hooks.addAction('hosting.account.created', handler, { owner: 'crm' })`.

## 6. Безпека

| Загроза | Захист |
|---------|--------|
| Облікові дані панелі | AES-256-GCM (`APP_SECRET`), розшифровуються лише в `ServerService.client()`; у web — ніколи |
| Транспорт | TLS-перевірка за замовчуванням; POST (паролі не в URL); таймаут 20 с; ≤ 10 МБ; без редиректів |
| IDOR | кабінет шукає акаунт за `id + userId` → 404 |
| Ін'єкції в панель | валідація: домен, імена (БД, FTP, скриньки), розклад і команда cron (один рядок), каталог FTP без `..`, тип DNS-запису |
| Системні обʼєкти | зарезервовані логіни (root, admin, mysql…); службові cron адміністратора не видаляються без вибору власника; привʼязаних користувачів не видалити з консолі |
| Подвійна оплата | одна операція на користувача, блокування рядка, 5 замовлень / 10 хв |
| Навантаження | 20 запитів до панелі / хв на користувача; кеш сесії панелі |
| Паролі | генерація 16 символів (крипто-ГВЧ), показ один раз; власні — ≥ 10, різні класи |
| Діагностика | лише `manage`; поля pass / secret / key / token / auth / dkim маскуються |

Для production: окремий адміністратор панелі (не root) з доступом лише з IP платформи; після передачі пароля
в чат / листом — змінити його.

## 7. Перевірено

- **Unit** (46): правила, транспорт, хуки, Sandbox (повний цикл, каскад, збої).
- **E2E Sandbox** (56): гроші й повернення, усі розділи консолі, рендер усіх сторінок і вкладок (uk / en), журнал через хуки.
- **E2E ISPmanager 6.155** (`isp.flowaxy.com`): читання всіх розділів; створення й видалення тестових обʼєктів
  (користувач, сайт з DNS-зоною, TXT-запис, поштовий домен і скринька, БД, FTP, cron), блокування, вхід від імені,
  акаунт платформи; після тесту панель у вихідному стані.

## 8. Далі

Керування ресурсами з кабінету (ті самі `PanelService`-методи з `owner = акаунт`), випуск Let's Encrypt, знижки за строк
(фільтр `hosting.order.price`), провайдери HestiaCP / DirectAdmin, воркер для кількох інстансів API.
