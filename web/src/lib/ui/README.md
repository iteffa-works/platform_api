# UI + конструктор

## UI-kit (`lib/ui`)

| Шар | Призначення |
|-----|-------------|
| `elements/` | кнопки, інпути, лінки |
| `components/` | картки, таблиці, поля |
| `patterns/` | Stack, Row, Toolbar |
| `layouts/` | AppShell, Topbar |
| `templates/` | оболонки екранів |

## Конструктор (`lib/constructor`)

Сторінки збираються **масивом** у `pages.ts`: шлях → шаблон → слоти з блоків.

```ts
{ path: '/app', template: 'cabinet', slots: { default: [{ block: 'accounts.panel' }] } }
```

Нова сторінка = новий елемент у `pages[]`, без файлу в `routes/`.

## Блоки (`lib/blocks`)

Підставляються за id через `registerBlock`. Доменна логіка — у `lib/domain/*`.

## Роут

Один catch-all: `routes/[...slug]` → `PageHost`.
