# web/src/lib

| Шар | Призначення |
|-----|-------------|
| `config/` | публічні константи (origin, назва) |
| `core/` | HTTP-клієнт `/api/v1`, токен сесії |
| `ui/` | UI-kit: `elements` → `components` → `patterns` → `layouts` → `templates`, `styles` |
| `constructor/` | каталог сторінок `pages.ts` + реєстр блоків |
| `blocks/` | UI-блоки, що підставляються за id |
| `domain/` | клієнтська логіка модулів (`auth`, `admin`) |
| `shared/` | типи і утиліти |

## Конструктор сторінок

Один catch-all роут `routes/[...slug]` → `PageHost`. Нова сторінка — запис у `pages[]`, без файлу в `routes/`:

```ts
{
  id: 'admin',
  path: '/admin',
  access: 'admin',         // public | user | admin
  template: 'admin',       // landing | auth | cabinet | admin
  load: loadAdminUsers,    // дані сторінки (необовʼязково)
  slots: { default: [{ block: 'admin.users' }] },  // default | actions
}
```

Новий блок: компонент у `blocks/` + `registerBlock('id', Cmp)` у `blocks/register.ts`.

Головна (`/`) — шаблон `landing` + секції `site.hero`, `site.features`, `site.workflow`, `site.cta`.

## Auth extensions

`domain/auth/extensions/*` — клієнтські розширення форми (поля, валідація, слоти UI).
Серверна частина — `api/src/modules/auth/extensions`.
