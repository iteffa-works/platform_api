# Плагіни

Два рівні розширення:

| | API | Web | Вимикається |
|-|-----|-----|-------------|
| **Модуль ядра** | `api/src/modules/<name>` | `web/src/lib/plugins/<name>` (рядок у `index.ts`) | ні |
| **Addon** | `api/src/plugins/<name>` | `web/src/plugins/<name>` (автовиявлення) | так — `/admin/plugins`, без перезапуску |

Addon складається з двох половин з **однаковим `name`**: API — джерело істини про стан, web лише показує.

## Як працює увімкнення

```
адмінка ──PATCH /admin/plugins/:name──▶ core/plugins/registry ──▶ plugin_states (БД) + кеш у памʼяті
web ──GET /plugins → { enabled: [...] }──▶ ховає сторінки (404) і пункти меню вимкнених addon
```

- **Маршрути** addon монтуються в окремий router за «воротами»: вимкнено → запит іде далі → 404.
- **Події** (`events`) addon викликаються лише коли увімкнено.
- **Міграції** застосовуються завжди (схема є навіть у вимкненого) — дані не губляться.
- **Права** (`permissions`) реєструються завжди — рівні в ролях зберігаються.
- Новий addon з'являється **вимкненим** (`defaultEnabled: true` — щоб навпаки).
- Повністю не завантажувати (ні маршрутів, ні міграцій) — `api/src/core/plugins/disabled.ts`.

## API-половина

```ts
// api/src/plugins/hello/index.ts
export const plugin: Plugin = {
  name: 'hello',
  title: 'Hello',                  // для /admin/plugins
  description: 'Приклад',
  version: '0.1.0',
  permissions: { hello: { label: 'Hello', levels: ['view', 'manage'] } },
  routes(router) {
    router.get('/cabinet/hello', requireUser, (_req, res) => res.json({ ok: true }));
  },
  onEnable: async () => {},        // помилка скасовує увімкнення
  onDisable: async () => {},
};
```

Міграції — `api/src/plugins/<name>/migrations/<YYYYMMDD-NN-опис>.ts`, як у модулях ядра.

## Web-половина

```ts
// web/src/plugins/hello/index.ts
export const plugin: WebPlugin = {
  name: 'hello',
  messages: { uk: { 'nav.hello': 'Привіт' }, en: { 'nav.hello': 'Hello' } },
  blocks: { 'hello.main': HelloBlock },
  nav: [{ section: 'cabinet', href: '/app/hello', label: 'hello:nav.hello', icon: 'apps' }],
  pages: [{
    id: 'hello', path: '/app/hello', section: 'cabinet', access: 'user', template: 'cabinet',
    title: 'hello:nav.hello', slots: { default: [{ block: 'hello.main' }] },
  }],
};
```

- `section` — у чию навігацію / шапку вбудовується (`admin`, `cabinet`); за замовчуванням — власна.
- Переклади addon — `$t('<плагін>:<ключ>')`; `uk` обовʼязковий. Ключі `activity.*`, `notification.*`, `resource.*`
  реєструються без префікса — так ядро показує журнал дій і назву ресурсу в матриці ролей.
- Сторінки addon рендеряться лише в браузері (стан addon — з API).

## Плагіни

| Плагін | Що | ТЗ |
|--------|----|----|
| `ispmanager` | ISPmanager 6 Host: сервери, хостинг-акаунти, SSO в панель | [ispmanager.md](ispmanager.md) |
