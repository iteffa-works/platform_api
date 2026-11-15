# ТЗ: плагін ISPmanager 6 Host

Статус: **фаза 1 реалізована** (див. «Етапи»). Система плагінів — [docs/plugins/README.md](README.md).

## 1. Мета

Продавати й обслуговувати віртуальний хостинг на панелях **ISPmanager 6 Host** з нашої платформи:
адміністратор підключає сервери й створює хостинг-акаунти користувачам, користувач бачить свій хостинг
у кабінеті й входить у панель без пароля (SSO).

## 2. Ролі

| Хто | Може |
|-----|------|
| Адміністратор (`ispmanager: view`) | бачити сервери, акаунти, користувачів панелі |
| Адміністратор (`ispmanager: manage`) | CRUD серверів, перевірка зʼєднання, створення / привʼязка / блокування / видалення акаунтів |
| Користувач (сесія) | свої хостинг-акаунти, сайти, вхід у панель, зміна пароля панелі |
| Адміністратор (`plugins: manage`) | увімкнути / вимкнути плагін (`/admin/plugins`) |

## 3. Інтеграція з ISPmanager 6

- Точка входу: `POST https://<host>:1500/ispmgr`, тіло `application/x-www-form-urlencoded`, `out=json`.
  POST, а не GET — щоб паролі не потрапляли в логи вебсервера панелі.
- Автентифікація: `func=auth&username&password` → id сесії; далі `auth=<id>`. Сесія кешується в памʼяті на
  `url + login`; помилка типу `auth` → один повторний вхід.
- Дії від імені користувача панелі — параметр `su=<login>` (сесія адміністратора).
- SSO: `func=session.newkey&username=<login>&key=<random>` → користувачу віддається одноразове посилання
  `…/ispmgr?func=auth&username=<login>&key=<key>&checkcookie=no`.
- Самопідписаний сертифікат: прапорець `verifyTls` на сервері (за замовчуванням увімкнено).
- Відповідь `{"doc": …}` нормалізується: `{"$": "v"}` → `"v"`, атрибути `$name` → `name`, `elem` — завжди масив.
- Помилка панелі (`doc.error`) → HTTP 502 з текстом панелі; недоступність / таймаут (20 с) → 502.

| Дія | Функція |
|-----|---------|
| Перевірка | `auth` + `user` + `preset` |
| Шаблони (тарифи панелі) | `preset` |
| Користувачі панелі | `user` |
| Створити користувача | `user.edit` `sok=ok name passwd confirm preset fullname` |
| Змінити пароль | `user.edit` `sok=ok elid passwd confirm` |
| Блокувати / розблокувати | `user.suspend` / `user.resume` `elid` |
| Видалити | `user.delete` `elid` |
| Сайти користувача | `webdomain` + `su` |
| SSO | `session.newkey` |

## 4. Дані

| Таблиця | Поля |
|---------|------|
| `isp_servers` | `name`, `url` (без `/ispmgr`), `username`, `passwordEnc` (AES-GCM, `APP_SECRET`), `verifyTls`, `isActive`, `defaultPreset` |
| `isp_accounts` | `serverId` → `isp_servers` (RESTRICT), `userId` → `users` (CASCADE), `panelUser`, `preset`, `status` (`active` / `suspended`); унікально `serverId + panelUser` |
| `plugin_states` | `name`, `enabled` — стан плагінів (ядро платформи) |

Пароль панелі ніколи не повертається в web (лише ознака «збережено»). Пароль нового акаунта, згенерований
платформою, показується адміністратору **один раз** і не зберігається.

## 5. API (`/api/v1`)

| Маршрут | Право |
|---------|-------|
| `GET /admin/ispmanager/servers` | view |
| `POST /admin/ispmanager/servers` · `PATCH\|DELETE /admin/ispmanager/servers/:id` | manage |
| `POST /admin/ispmanager/servers/:id/check` | manage |
| `GET /admin/ispmanager/servers/:id/presets` · `GET /admin/ispmanager/servers/:id/users` | view |
| `GET /admin/ispmanager/accounts` | view |
| `POST /admin/ispmanager/accounts` `{serverId,email,panelUser,preset?,password?,mode:create\|link}` | manage |
| `POST /admin/ispmanager/accounts/:id/suspend\|resume` · `DELETE /admin/ispmanager/accounts/:id` `{removeFromPanel}` | manage |
| `GET /cabinet/hosting` · `GET /cabinet/hosting/:id/sites` | сесія |
| `POST /cabinet/hosting/:id/login` → `{url}` · `POST /cabinet/hosting/:id/password` `{password}` | сесія, власний акаунт, не заблокований |

Вимкнений плагін: маршрути відповідають 404, web ховає сторінки й меню, дані в БД зберігаються.

## 6. Web

| Сторінка | Що |
|----------|----|
| `/admin/hosting` | акаунти: створити новий у панелі / привʼязати наявного користувача панелі, блокування, видалення |
| `/admin/hosting/servers` | сервери: додати, перевірити зʼєднання, вимкнути, видалити |
| `/app/hosting` | кабінет: мої акаунти, «Відкрити панель», сайти, зміна пароля |
| `/admin/plugins` | (ядро) список плагінів, увімкнення / вимкнення |

## 7. Безпека

- Усі дії адмінки — `requireUser` + `admin.panel:view` + `ispmanager:view|manage`; кабінет — лише власні акаунти.
- Облікові дані панелі — лише на сервері, зашифровані; у журнал дій не пишуться.
- SSO-ключ — 32 hex-символи, одноразовий, генерується на кожен клік.
- URL сервера задає лише адміністратор з `manage` (SSRF-ризик прийнятний; обмеження — схема http/https).
- Журнал дій: `hosting.created|suspended|resumed|deleted|password_changed`, `admin.plugin_toggled`.

## 8. Етапи

| Фаза | Що | Стан |
|------|----|------|
| 1 | Система плагінів (увімкнення в адмінці), сервери, акаунти, SSO, сайти, пароль | ✅ |
| 2 | Звʼязок з білінгом: тариф платформи → шаблон панелі, щомісячне списання, автоблокування при нулі | — |
| 3 | Самообслуговування: замовлення хостингу з кабінету, вибір сервера за навантаженням / лімітом акаунтів | — |
| 4 | Кабінет: домени, пошта, бази даних, SSL через `su` (CRUD) | — |
| 5 | Синхронізація статусів з панеллю за розкладом, сповіщення, метрики використання (диск / трафік) | — |

## 9. Критерії приймання (фаза 1)

1. Плагін вимкнено за замовчуванням; після увімкнення в `/admin/plugins` без перезапуску API зʼявляються меню й маршрути.
2. Додавання сервера з неправильним паролем → «Перевірити» показує помилку панелі.
3. Створений акаунт видно в панелі під указаним шаблоном; блокування / розблокування відображаються в панелі.
4. Користувач у кабінеті бачить лише свої акаунти, «Відкрити панель» входить без пароля.
5. Вимкнення плагіна → `/api/v1/cabinet/hosting` = 404, пункти меню зникають.
