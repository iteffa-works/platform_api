# Виклад на сервер

Два Node-процеси за reverse proxy: **API** (Express, порт 4000) і **web** (SvelteKit adapter-node, порт 3000),
база **MySQL / MariaDB**. Конкретний хостинг ще не обрано — інструкція загальна (VPS або сервер з панеллю, де можна
запускати Node.js).

## 1. Вимоги

| | |
|-|-|
| Node.js | ≥ 24 (`node --env-file` для PM2-конфігу) |
| БД | MySQL 8 / MariaDB 10.6+, utf8mb4, окремий користувач з правами на свою базу |
| Reverse proxy | Nginx (приклад — [deploy/nginx.conf.example](../deploy/nginx.conf.example)) або вбудований у панель хостингу |
| HTTPS | обовʼязково: cookie сесії в production — `Secure` |
| Менеджер процесів | PM2 ([ecosystem.config.cjs](../ecosystem.config.cjs)) або systemd |

## 2. Збірка

```bash
git clone <репозиторій> flowaxy && cd flowaxy
npm ci
npm run build          # api → api/dist, web → web/build
```

## 3. Налаштування

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env
```

**api/.env** (обовʼязкові для production):

| Змінна | Що |
|--------|----|
| `NODE_ENV=production` | захищені cookie, перевірка секретів під час старту |
| `APP_SECRET` | ≥ 32 випадкові символи (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). **Не змінювати після запуску** — ним зашифровано паролі панелей і 2FA |
| `CLIENT_API_KEY` | власний ключ (не `dev-client-key`) |
| `DB_*` | підключення до БД |
| `DATA_DIR` | каталог файлів (аватари) поза релізом, напр. `/var/lib/flowaxy/data` |

API без коректних `APP_SECRET` / `CLIENT_API_KEY` у production **не стартує** — це навмисно.

**web/.env**: `PUBLIC_APP_ORIGIN` і `ORIGIN` — справжній домен (`https://example.com`), `PUBLIC_APP_NAME` — назва в заголовках.

## 4. База й перший запуск

```bash
npm run migrate                      # міграції (API також застосовує їх під час старту)
pm2 start ecosystem.config.cjs && pm2 save
pm2 startup                          # автозапуск після перезавантаження сервера
```

Перший зареєстрований користувач отримує роль розробника. Аварійна передача ролі:
`npm run roles:set-developer -w api -- <email>`.

## 5. Reverse proxy

`/api/` → `127.0.0.1:4000`, решта → `127.0.0.1:3000`, HTTPS, `X-Forwarded-*`. Приклад з кешем статики `/_app/immutable/`
і gzip — [deploy/nginx.conf.example](../deploy/nginx.conf.example).

## 6. Після викладу — перевірити

- [ ] `https://домен/api/health` → `{"ok":true,"db":true}`
- [ ] `https://домен/robots.txt`, `https://домен/sitemap.xml` — з правильним доменом
- [ ] реєстрація → вхід → кабінет
- [ ] адмінка → Хостинг → Сервери: підключити ISPmanager, синхронізація без помилок
- [ ] адмінка → Білінг → Реквізити: номер картки й / або IBAN — тоді в кабінеті зʼявляться способи поповнення
- [ ] адмінка → Хостинг → Тарифи: тарифи з шаблонів, «Популярний», головна показує тарифи
- [ ] заявка на поповнення з кабінету → «Кошти надійшли — зарахувати» в адмінці → баланс змінився

## 7. Оновлення

```bash
git pull && npm ci && npm run build
pm2 reload ecosystem.config.cjs     # API дочікується поточних запитів (SIGTERM → закриття за ≤ 10 с)
```

Міграції застосовуються під час старту API. Резервна копія БД перед оновленням — обовʼязково.

## 8. Обмеження

- **Один процес API**: фонове завдання хостингу (строки оплати, синхронізація з панелями) не розраховане на кілька
  інстансів одночасно — у PM2 `instances: 1`.
- Файли користувачів — у `DATA_DIR`: включіть його в резервні копії разом із БД.
