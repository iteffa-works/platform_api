# web/src/lib

| Шар | Призначення |
|-----|-------------|
| `config/` | публічні константи (origin, назва) |
| `core/` | HTTP-клієнт `/api/v1`, токен сесії |
| `ui/` | UI-kit: `elements` → `components` → `patterns` → `layouts` → `templates`, `styles` |
| `constructor/` | реєстр сторінок / блоків / навігації з плагінів, `PageHost`, перевірка доступу |
| `plugins/` | web-плагіни: `site`, `auth`, `cabinet`, `admin` |
| `domain/auth` | сесія, поточний користувач, `can()`, auth-розширення форми |
| `shared/` | типи і утиліти |

## Web-плагіни

Плагін — тека в `plugins/` з `index.ts`, що експортує `WebPlugin`, і рядок у `plugins/index.ts`.
Окремих файлів у `routes/` не потрібно: один catch-all `routes/[...slug]` → `PageHost`.

```ts
export const admin: WebPlugin = {
  name: 'admin',
  blocks: { 'admin.roles': RolesPanelBlock },          // id блоку → компонент
  nav: [                                              // вкладки шаблону; ховаються без права
    { href: '/admin/roles', label: 'Ролі', permission: ['roles', 'view'] },
  ],
  pages: [{
    id: 'admin-roles',
    path: '/admin/roles',
    access: 'user',                                   // public | user
    permission: ['roles', 'view'],                    // рівень права ролі (необовʼязково)
    template: 'admin',                                // landing | auth | cabinet | admin
    title: 'Ролі',
    load: loadRolesPage,                              // дані сторінки (необовʼязково)
    slots: { default: [{ block: 'admin.roles' }] },   // default | actions
  }],
};
```

| Плагін | Сторінки | Доступ |
|--------|----------|--------|
| `site` | `/` | публічно |
| `auth` | `/login`, `/register` | публічно |
| `cabinet` | `/app`, `/app/account`, `/app/preferences`, `/app/access` | будь-який користувач |
| `admin` | `/admin` (панель), `/admin/users`, `/admin/roles` | `admin.panel`, `users`, `roles: view` |

## Тема (світла / темна)

`domain/theme` + `ui/components/ThemeToggle`. Вибір зберігається:

1. **cookie `theme`** — на пристрої, і для гостей; `hooks.server.ts` ставить `<html data-theme>` ще на SSR (без мерехтіння);
2. **акаунт** — таблиця `user_preferences` (`PATCH /cabinet/preferences`), приходить у `/auth/me`.

Після входу тема акаунта має пріоритет; якщо в акаунті ще не обрано — туди зберігається вибір з пристрою.
Кольори — токени `--ui-*` у `ui/styles/tokens.css` (`:root` і `:root[data-theme='dark']`).

## Оболонки

- **Кабінет** — шапка-картка: логотип · вкладки плагіна · панель (тема, адмінка, вихід, ID, аватар).
- **Адмінка** — темна смуга (`--ui-bar-*`) з закріпленими розділами (`pinned`) + бічне меню з пошуком і групами (`group`).
- Спільні блоки: `Panel`, `StatCard`, `LinkCard`, `DataTable`, `Badge`, `Avatar` (ідентикон), `Icon`.

## Сесія

Токен у `localStorage`, тому захищені сторінки перевіряються лише в браузері (SSR віддає порожню оболонку).
Після переходу сесії на cookie це обмеження прибирається — див. `routes/[...slug]/+page.ts`.

## Auth extensions

`domain/auth/extensions/*` — клієнтські розширення форми (поля, валідація, слоти UI).
Серверна частина — `api/src/modules/auth/extensions`.
