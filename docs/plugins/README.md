# Плагіни

| | Де | Вимикається |
|-|----|-------------|
| **Ядро Flowaxy** | `api/src/flowaxy` — фреймворк, нічого не знає про застосунок | — |
| **Розширення** | `api/src/extensions/<name>` — системний функціонал (`ui`, `plugins`) | ні |
| **Плагін** | `api/src/plugins/<name>` (+ для старих — `web/src/lib/plugins/<name>`) | так — `/admin/plugins`, без перезапуску |

Плагіни між собою звʼязуються портами (`flowaxy/services`: `provide` / `use`) і хуками (`flowaxy/hooks`);
вимкнений плагін — його порти дають 503. Нові плагіни не мають коду в web.

Плагін не має коду в web. API описує сторінки деревом вузлів з даними (server-driven UI),
а `web/src/lib/constructor/remote` рендерить їх універсальними компонентами UI-kit.
Новий плагін = тека в `api/src/plugins` — збирати web не треба.

```
web: /app/hosting/12 ──GET /ui/manifest──▶ маршрути, меню, сервіси, переклади (мова запиту, права користувача)
                     ──POST /ui/page {path, state}──▶ plugin.ui.pages[].render(ctx) → [вузли з даними]
кнопка / форма ──REST /api/v1/<маршрут плагіна>──▶ права перевіряє маршрут ──▶ перерендер / перехід
```

## Як працює увімкнення

- Стан — `plugin_states` + кеш у памʼяті; новий плагін зʼявляється **вимкненим** (або `defaultEnabled: true`).
- Вимкнено → маршрути й `/ui/page` дають 404, маніфест без сторінок / меню, події не викликаються.
- Міграції й права (`permissions`) реєструються завжди — дані й рівні в ролях зберігаються.
- Не завантажувати взагалі — `api/src/flowaxy/plugins/disabled.ts`.
- Збій `init` плагіна не зупиняє застосунок — лише лог.

## Плагін

```ts
// api/src/plugins/hello/index.ts
export const plugin: Plugin = {
  name: 'hello',
  title: 'Hello', description: 'Приклад', version: '0.1.0',
  permissions: { hello: { label: 'Hello', levels: ['view', 'manage'] } },
  routes(router) {                                   // REST: дані й дії (права — тут)
    router.post('/cabinet/hello/ping', requireUser, (_req, res) => res.json({ pong: 'ok' }));
  },
  ui: {
    messages: { uk: { 'nav.hello': 'Привіт', 'ping': 'Пінг', 'done': 'Відповідь: {pong}' }, en: { /* … */ } },
    nav: [{ section: 'cabinet', href: '/app/hello', label: 'nav.hello', icon: 'apps' }],
    services: [{ href: '/app/hello', label: 'nav.hello', icon: 'apps', tone: 'purple' }],
    pages: [{
      path: '/app/hello',                            // параметри — /app/hello/[id] → ctx.params.id
      section: 'cabinet',                            // шаблон і меню розділу: cabinet | admin
      title: 'nav.hello',
      async render(ctx) {                            // ctx: userId, lang, t(), can(), params, state
        return [ui.panel(ctx.t('nav.hello'), [
          { type: 'button', label: ctx.t('ping'),
            action: { method: 'POST', url: '/cabinet/hello/ping', success: { notice: ctx.t('done'), reload: false } } },
        ])];
      },
    }],
  },
};
```

## Схема ([api/src/flowaxy/ui/schema.ts](../../api/src/flowaxy/ui/schema.ts))

| Група | Вузли |
|-------|-------|
| Розкладка | `stack`, `row`, `grid`, `panel`, `tabs` (посилання з query) |
| Вміст | `text`, `heading`, `badge`, `link`, `fields`, `table`, `banner`, `empty`, `code` |
| Візуальні | `ring` (заповнення %), `flag` (країна), `icon`, `status` (коло-стан), `tile` (кольорова плитка з кнопкою-футером) |
| Дії | `button` (`href`, `action` або `dialog` — модальне вікно), `menu` (⋯ рядка), `form` (text, password, email, number, date, url, select, choice-картки, checkbox, hidden) |
| Адмінка | `stats` (KPI), `breadcrumbs`, `progress`, `panel.actions` (кнопки в шапці), `table.search` (фільтр рядків) |

- **Значення** в тексті — `{ type: 'money' | 'date' | 'datetime' }`: форматує клієнт мовою й поясом користувача.
- **Дія** — виклик REST-маршруту плагіна: `confirm`, `prompt` (значення в body), `openUrl` (нова вкладка),
  `success`: `notice` (з `{ключ}` відповіді), `errorKey`, `result` (`secret` — показати один раз, `json`), `redirect`, `reload`.
- **Жива форма** — поле `live: true`: зміна перерендерює сторінку з поточними значеннями (`ctx.state`) — підсумки, залежні поля.
- **Фільтр через URL** — поле `navigate: true`: зміна задає `?name=value` (переживає дії й оновлення).
- **Стан сторінки** — query URL (`?tab=deleted`, `?panel=renew`) + значення живої форми → `ctx.state`.
- Новий тип вузла — у `schema.ts` (API), дзеркалі `web/src/lib/constructor/remote/schema.ts` і `UiNode.svelte`.

## Огляди з внесків плагінів (`ui.dashboard`)

Панель адмінки (і згодом кабінету) не знає про дані плагінів — кожен плагін додає свої показники й панелі фільтром:

```ts
hooks.addFilter('ui.dashboard', async (sections, { ctx, area }): Promise<DashboardSection[]> => {
  if (area !== 'admin' || !ctx.can('logs', 'view')) return sections;
  const t = withMessages(ctx, messages).t;          // тексти — зі словника свого плагіна
  return [...sections, { order: 50, stats: [...], panels: [...] }];
}, { owner: 'activity', when: () => isEnabled('activity') });
```

Вимкнений плагін зникає з огляду сам (`when`). Сторінки розділу `admin` будь-якого плагіна вимагають `admin.panel:view`.

## Хуки й фільтри (`flowaxy/hooks`)

```ts
hooks.addAction('hosting.account.created', async ({ account }) => { /* CRM, вебхук… */ }, { owner: 'crm', priority: 20 });
hooks.addFilter('hosting.order.price', (cents, { months }) => (months >= 12 ? cents * 0.9 : cents));
await hooks.doAction('my.event', payload);            // сервіс оголошує подію
const price = await hooks.applyFilters('my.filter', value, context);
```

- Пріоритет: менший — раніше; помилка підписника ізольована (лог), решта виконуються.
- `when: () => isEnabled('<плагін>')` — підписка плагіна діє лише поки він увімкнений.
- Типи — declaration merging `interface HookActions / HookFilters` у файлі `hooks.ts` плагіна.
- `plugin.events` і `flowaxy/events` (`on` / `emit`) — сумісні аліаси дій.

## Еталонна структура плагіна

Див. [hosting.md](hosting/hosting.md): `index.ts` (маніфест) → `module.ts` (корінь композиції, класи-сервіси) →
`domain/` (моделі, чисті правила) · `providers/` (зовнішні системи за контрактом) · `services/` · `http/` · `ui/` · `hooks.ts`.

## Безпека

- Схема — лише подання: кожна дія — REST-маршрут плагіна з власною перевіркою прав (`requireUser`, `requirePermission`).
- `/ui/page` додатково перевіряє `permission` сторінки й увімкненість плагіна; маніфест містить лише дозволене користувачу.
- Тексти рендеряться Svelte як текст (без `{@html}`) — дані з панелей / користувачів не можуть вбудувати розмітку.
- Посилання `openUrl` відкриваються лише для `http(s)://`.

## Плагіни

| Плагін | Що | ТЗ |
|--------|----|----|
| `hosting` | Хостинг: тарифи, замовлення з балансу, керування акаунтами й серверами, копія даних панелі з синхронізацією; провайдер ISPmanager 6 | [hosting.md](hosting/hosting.md) |
