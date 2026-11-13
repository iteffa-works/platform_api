# web/src/lib

| Шар | Призначення |
|-----|-------------|
| `config/` | публічні константи (origin, назва) |
| `core/` | HTTP-клієнт `/api/v1`, токен сесії |
| `ui/` | UI-kit: `elements` → `components` → `patterns` → `layouts` → `templates`, `styles` |
| `constructor/` | каталог сторінок `pages.ts` + реєстр блоків |
| `blocks/` | UI-блоки, що підставляються за id |
| `domain/` | клієнтська логіка модулів (`auth`, `accounts`, `admin`) |
| `shared/` | типи і утиліти |

## Конструктор сторінок

Один catch-all роут `routes/[...slug]` → `PageHost`. Нова сторінка — запис у `pages[]`, без файлу в `routes/`:

```ts
{
  id: 'cabinet',
  path: '/app',
  access: 'user',          // public | user | admin
  template: 'cabinet',     // landing | auth | cabinet | admin
  load: loadAccounts,      // дані сторінки (необовʼязково)
  slots: { default: [{ block: 'cabinet.dashboard' }] },  // default | actions | meta
}
```

Новий блок: компонент у `blocks/` + `registerBlock('id', Cmp)` у `blocks/register.ts`.

## Auth extensions

`domain/auth/extensions/*` — клієнтські розширення форми (поля, валідація, слоти UI).
Серверна частина — `api/src/modules/auth/extensions`.
