/** Сторінки кабінету: список, замовлення, картка акаунта (лише власні акаунти) */
import { config } from '../../../../../config/index.js';
import { ui, type UiButton, type UiContext, type UiNode, type UiPage } from '../../../../../flowaxy/ui/index.js';
import { HttpError } from '../../../../../shared/http/index.js';
import { hosting } from '../../../module.js';
import { presentAccount } from '../../../services/presenter.js';
import { accountTone, countryName, daysLeft, formatSize, freeSize, paidLabel, percent, type AccountView } from '../../format.js';
import { panel } from '../../kit.js';
import { datagrid, gridQuery, localGrid, searchBox } from '../../grid.js';
import { cronSection } from '../../sections/cron.js';
import { databasesSection } from '../../sections/databases.js';
import { dnsSection } from '../../sections/dns.js';
import { ftpSection } from '../../sections/ftp.js';
import { mailSection } from '../../sections/mail.js';
import { PanelScope, type PanelSectionRenderer } from '../../sections/scope.js';
import { sitesSection } from '../../sections/sites.js';
import { sslSection } from '../../sections/ssl.js';

const periods = () => hosting.config.periods;

const C = '/cabinet/hosting';

function noteButton(ctx: UiContext, account: AccountView): UiNode {
  return {
    type: 'button',
    variant: 'link',
    label: account.note || ctx.t('addNote'),
    action: { method: 'PATCH', url: `${C}/${account.id}`, prompt: { message: ctx.t('notePrompt'), field: 'note', value: account.note ?? '' } },
  };
}

function locationNodes(ctx: UiContext, account: AccountView): UiNode[] {
  const server = account.server;
  if (!server) return [ui.text('—')];
  return [
    { type: 'row', align: 'center', children: [{ type: 'flag', code: server.location }, ui.text({ b: countryName(server.location, ctx.lang) })] },
    ...(server.ipv4.length ? [ui.text([{ b: 'IPv4: ' }, server.ipv4.join(', ')], { size: 'sm' })] : []),
    ...(server.ipv6.length ? [ui.text([{ b: 'IPv6: ' }, server.ipv6.join(', ')], { size: 'sm' })] : []),
  ];
}

/** Дії рядка списку: продовжити, відкрити панель */
function rowActions(ctx: UiContext, account: AccountView): UiNode {
  const items: UiButton[] = [];
  const canRenew = Boolean(account.plan) && (account.status === 'active' || account.suspendReason === 'billing');
  if (canRenew) items.push({ type: 'button', variant: 'ghost', icon: 'wallet', label: ctx.t('renew'), href: `/app/hosting/${account.id}?panel=renew` });
  if (account.status === 'active') {
    items.push({
      type: 'button',
      icon: 'external',
      label: ctx.t('openPanel'),
      action: { method: 'POST', url: `${C}/${account.id}/login`, openUrl: 'url', success: { reload: false } },
    });
  }
  return { type: 'actions', items };
}

/* ---------- /app/hosting ---------- */

const list: UiPage = {
  path: '/app/hosting',
  section: 'cabinet',
  title: 'nav.hosting',
  async render(ctx) {
    const deleted = ctx.state.tab === 'deleted';
    const { accounts } = await hosting.accounts.listMine(ctx.userId);
    // Ще жодного акаунта — замість порожньої таблиці заклик замовити
    if (!accounts.length) {
      return [ui.panel(undefined, [
        { type: 'empty', text: ctx.t('empty') },
        ui.row([{ type: 'button', label: ctx.t('orderNew'), icon: 'plus', size: 'lg', href: '/app/hosting/order' }], 'end'),
      ])];
    }
    const scoped = accounts.filter((account) => (account.status === 'deleted') === deleted);
    const deletedCount = accounts.filter((account) => account.status === 'deleted').length;
    const query = gridQuery(ctx.state, ['name', 'paid', 'disk'], 'name');
    const page = localGrid(scoped, query, {
      text: (account) => `${account.login} ${account.note ?? ''} ${account.plan?.name ?? ''} ${account.server?.name ?? ''}`,
      sort: {
        name: (account) => account.login,
        paid: (account) => (account.paidUntil ? new Date(account.paidUntil).getTime() : null),
        disk: (account) => account.usage.diskUsedMb,
      },
    });

    const grid = datagrid({
      ctx,
      query: page.query,
      total: page.total,
      toolbar: {
        segments: {
          name: 'tab',
          value: deleted ? 'deleted' : '',
          items: [
            { label: ctx.t('tab.available'), value: '', count: accounts.length - deletedCount },
            { label: ctx.t('tab.deleted'), value: 'deleted', count: deletedCount },
          ],
        },
        search: searchBox(ctx, query),
      },
      empty: deleted ? ctx.t('emptyDeleted') : ctx.t('empty'),
      columns: [
        { key: 'name', label: ctx.t('col.name'), sortable: true },
        { key: 'plan', label: ctx.t('col.plan') },
        { key: 'paid', label: ctx.t('paidUntilField'), sortable: true },
        { key: 'sites', label: ctx.t('col.sites') },
        { key: 'disk', label: ctx.t('col.disk'), sortable: true },
        { key: 'location', label: ctx.t('col.location') },
        { key: 'actions', label: '', align: 'right', width: '88px' },
      ],
      rows: page.rows.map((account) => {
          const usage = account.usage;
          const tone = accountTone(account);
          return {
            key: account.id,
            tone: account.status === 'suspended' ? 'danger' as const : tone === 'orange' ? 'warn' as const : account.status === 'deleted' ? 'muted' as const : undefined,
            cells: {
              name: [{
                type: 'row',
                align: 'center',
                children: [
                  { type: 'status', tone, icon: 'server' },
                  ui.stack([
                    account.status === 'deleted'
                      ? ui.text({ b: account.login })
                      : { type: 'link', text: account.login, href: `/app/hosting/${account.id}` },
                    account.status === 'deleted' ? ui.muted(account.note ?? '') : noteButton(ctx, account),
                  ], 0),
                ],
              }],
              plan: [ui.text({ b: account.plan?.name ?? account.package ?? '—' })],
              paid: [ui.text(paidLabel(ctx, account), { size: 'sm', tone: tone === 'green' ? 'muted' : 'warn' })],
              sites: [ui.badge(ctx.t('sitesOf', { used: usage.sitesUsed ?? '—', limit: usage.sitesLimit ?? '∞' }))],
              disk: [{
                type: 'row',
                align: 'center',
                children: [
                  { type: 'ring', value: percent(usage.diskUsedMb, usage.diskLimitMb) },
                  ui.stack([
                    ui.text([{ b: `${ctx.t('total')}: ` }, formatSize(usage.diskLimitMb)], { size: 'sm' }),
                    ui.text([{ b: `${ctx.t('free')}: ` }, freeSize(usage.diskUsedMb, usage.diskLimitMb)], { size: 'sm' }),
                  ], 0),
                ],
              }],
              location: locationNodes(ctx, account),
              actions: [rowActions(ctx, account)],
            },
          };
        }),
    });

    return [
      ui.row([
        ui.muted(ctx.t('listHint')),
        { type: 'button', label: ctx.t('orderNew'), icon: 'plus', href: '/app/hosting/order' },
      ], 'between'),
      ui.panel(undefined, [grid], true),
    ];
  },
};

/* ---------- /app/hosting/order ---------- */

const order: UiPage = {
  path: '/app/hosting/order',
  section: 'cabinet',
  title: 'order.title',
  async render(ctx) {
    const catalog = await hosting.orders.catalog(ctx.userId);
    const currency = catalog.currency;
    if (!catalog.plans.length || !catalog.locations.length) return [ui.panel(ctx.t('orderNew'), [ui.text(ctx.t('orderUnavailable'), { tone: 'muted' })])];

    const plan = catalog.plans.find((item) => String(item.id) === ctx.state.planId) ?? catalog.plans[0]!;
    const months = periods().includes(Number(ctx.state.months)) ? Number(ctx.state.months) : 1;
    const location = catalog.locations.find((item) => item.code === ctx.state.location)?.code ?? catalog.locations[0]!.code;
    const login = ctx.state.login ?? '';
    const total = (Number(plan.price) * months).toFixed(2);
    const enough = Number(catalog.balance) >= Number(total);

    const showLocations = catalog.locations.length > 1 || Boolean(catalog.locations[0]?.code);

    const crumbs: UiNode = { type: 'breadcrumbs', items: [{ label: ctx.t('nav.hosting'), href: '/app/hosting' }, { label: ctx.t('order.title') }] };

    return [crumbs, {
      type: 'form',
      layout: 'stack',
      fields: [
        {
          name: 'planId',
          kind: 'choice',
          label: ctx.t('step.plan'),
          value: String(plan.id),
          live: true,
          options: catalog.plans.map((item) => ({
            value: String(item.id),
            label: item.name,
            accent: [ui.money(item.price, currency), ` ${ctx.t('perMonth')}`],
            lines: [
              ...(item.diskMb ? [`${ctx.t('disk')}: ${formatSize(item.diskMb)}`] : []),
              `${ctx.t('sitesCount')}: ${item.sites ?? '∞'}`,
              ...(item.description ? [item.description] : []),
            ],
          })),
        },
        {
          name: 'months',
          kind: 'choice',
          label: ctx.t('step.period'),
          value: String(months),
          live: true,
          options: catalog.periods.map((period) => ({ value: String(period), label: ctx.t('months', { count: period }) })),
        },
        showLocations
          ? {
            name: 'location',
            kind: 'choice',
            label: ctx.t('step.location'),
            value: location ?? '',
            live: true,
            hint: ctx.t('locationHint'),
            options: catalog.locations.map((item) => ({
              value: item.code ?? '',
              label: countryName(item.code, ctx.lang),
              media: { type: 'flag', code: item.code, size: 20 },
            })),
          }
          : { name: 'location', kind: 'hidden', value: location ?? '' },
        {
          name: 'login',
          kind: 'text',
          label: ctx.t('step.name'),
          value: login,
          required: true,
          minlength: 3,
          autocomplete: 'off',
          placeholder: 'mysite',
          hint: ctx.t('accountNameHint'),
        },
      ],
      aside: [
        { type: 'heading', level: 3, text: ctx.t('summary') },
        {
          type: 'fields',
          items: [
            { label: ctx.t('col.plan'), value: { b: plan.name } },
            { label: ctx.t('term'), value: ctx.t('months', { count: months }) },
            ...(showLocations ? [{ label: ctx.t('col.location'), value: countryName(location, ctx.lang) }] : []),
            ...(plan.diskMb ? [{ label: ctx.t('disk'), value: formatSize(plan.diskMb) }] : []),
          ],
        },
        ui.row([ui.text(ctx.t('toPay'), { tone: 'muted' }), ui.text(ui.money(total, currency), { size: 'xl', bold: true })], 'between'),
        ui.row([ui.text(ctx.t('balance'), { size: 'sm', tone: 'muted' }), ui.text(ui.money(catalog.balance, currency), { size: 'sm', bold: true, tone: enough ? 'body' : 'warn' })], 'between'),
        ...(enough
          ? [ui.muted(ctx.t('orderNote'))]
          : [{ type: 'alert' as const, tone: 'warn' as const, text: ctx.t('notEnough'), action: { type: 'button' as const, variant: 'ghost' as const, label: ctx.t('topUp'), href: '/app/billing' } }]),
      ],
      submit: {
        label: ctx.t('payAndCreate'),
        size: 'lg',
        disabled: !enough,
        action: {
          method: 'POST',
          url: `${C}/order`,
          confirm: ctx.t('orderConfirm', { plan: plan.name, months, total: `${total} ${currency}` }),
          success: {
            result: { key: 'password', format: 'secret', title: ctx.t('orderDone', { login: '{account.login}' }), text: ctx.t('passwordOnce') },
            redirect: '/app/hosting/{account.id}',
          },
        },
      },
    }];
  },
};

/* ---------- /app/hosting/[id] ---------- */

const account: UiPage = {
  path: '/app/hosting/[id]',
  section: 'cabinet',
  title: 'account.title',
  async render(ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Хостинг-акаунт не знайдено');
    // Один запит до БД: і для подання, і для перевірки доступу до панелі
    const model = await hosting.accounts.find(id, ctx.userId);
    const account = presentAccount(model);
    const base = `/app/hosting/${id}`;
    const url = `${C}/${id}`;
    const active = account.status === 'active';
    const canRenew = Boolean(account.plan) && (active || account.suspendReason === 'billing');
    const links: AccountLinks = { base, url, active, canRenew };

    const nodes: UiNode[] = [
      { type: 'breadcrumbs', items: [{ label: ctx.t('nav.hosting'), href: '/app/hosting' }, { label: account.login }] },
      accountHeader(ctx, account, links),
      ...accountAlerts(ctx, account, links),
      accountStats(ctx, account, links),
    ];

    if (ctx.state.panel === 'renew' && canRenew && account.plan) nodes.push(renewPanel(ctx, account, links));
    if (ctx.state.panel === 'plan' && active && account.plan) nodes.push(await planPanel(ctx, account, links));

    if (!active) return nodes;

    /* Вкладки керування: ті самі розділи, що й у консолі адміністратора, — з власником = цей акаунт */
    const tab = (CABINET_TABS as readonly string[]).includes(ctx.state.tab ?? '') ? ctx.state.tab as CabinetTab : 'overview';
    nodes.push({
      type: 'tabs',
      items: CABINET_TABS.map((item) => ({ label: ctx.t(`tab.${item}`), href: item === 'overview' ? base : `${base}?tab=${item}`, active: item === tab })),
    });

    if (tab === 'overview') {
      nodes.push(...overviewNodes(ctx, account, base));
      return nodes;
    }
    if (tab === 'settings') {
      nodes.push(...settingsNodes(ctx, url, account));
      return nodes;
    }

    // Розділ: дані з копії в БД (акаунт власний і активний — перевірено вище); запит до панелі — лише записи DNS
    const scope = new PanelScope(ctx, model, { api: `${url}/panel`, page: base });
    try {
      nodes.push(...(await SECTIONS[tab](scope)));
    } catch (error) {
      if (error instanceof HttpError && error.status !== 502) throw error;
      nodes.push({ type: 'alert', tone: 'warn', text: ctx.t('panelError', { error: error instanceof Error ? error.message : '' }) });
    }
    return nodes;
  },
};

type AccountLinks = { base: string; url: string; active: boolean; canRenew: boolean };

/** Бейдж стану; «Закінчується» — активний, але строк ≤ 7 днів */
function statusBadge(ctx: UiContext, account: AccountView): UiNode {
  const tone = accountTone(account);
  if (account.status === 'active') return ui.badge(ctx.t(tone === 'orange' ? 'status.expiring' : 'status.active'), tone);
  return ui.badge(ctx.t(`status.${account.status}`), tone);
}

/** Шапка: логін, стан, сервер, примітка; дії праворуч */
function accountHeader(ctx: UiContext, account: AccountView, links: AccountLinks): UiNode {
  const server = account.server;
  const meta: UiNode[] = [];
  if (server) {
    meta.push({
      type: 'row',
      align: 'center',
      children: [
        { type: 'flag', code: server.location, size: 16 },
        ui.text([countryName(server.location, ctx.lang), ...(server.ipv4[0] ? [` · ${server.ipv4[0]}`] : [])], { size: 'sm', tone: 'muted' }),
      ],
    });
  }
  if (account.status !== 'deleted') meta.push(noteButton(ctx, account));

  const menu: UiButton[] = links.active
    ? [
      ...(account.plan ? [{ type: 'button' as const, label: ctx.t('changePlan'), href: `${links.base}?panel=plan` }] : []),
      { type: 'button', label: ctx.t('refreshUsage'), action: { method: 'POST', url: `${links.url}/usage` } },
      { type: 'button', label: ctx.t('settings'), href: `${links.base}?tab=settings` },
    ]
    : [];

  const buttons: UiNode[] = [];
  if (links.canRenew) buttons.push({ type: 'button', variant: 'ghost', icon: 'wallet', label: ctx.t('renew'), href: `${links.base}?panel=renew` });
  if (links.active) {
    buttons.push({
      type: 'button',
      icon: 'external',
      label: ctx.t('openPanel'),
      action: { method: 'POST', url: `${links.url}/login`, openUrl: 'url', success: { reload: false } },
    });
  }
  if (menu.length) buttons.push({ type: 'menu', items: menu });

  return ui.panel(undefined, [
    ui.row([
      {
        type: 'row',
        align: 'center',
        children: [
          { type: 'status', tone: accountTone(account), icon: 'server' },
          ui.stack([
            { type: 'row', align: 'center', children: [{ type: 'heading', text: account.login }, statusBadge(ctx, account)] },
            { type: 'row', align: 'center', children: meta },
          ], 2),
        ],
      },
      { type: 'row', align: 'center', children: buttons },
    ], 'between'),
  ]);
}

/** Повідомлення про стан: блокування, створення, видалення, строк закінчується */
function accountAlerts(ctx: UiContext, account: AccountView, links: AccountLinks): UiNode[] {
  const renew: UiButton | undefined = links.canRenew && ctx.state.panel !== 'renew'
    ? { type: 'button', label: ctx.t('renew'), href: `${links.base}?panel=renew` }
    : undefined;
  if (account.status === 'suspended') {
    return [{ type: 'alert', tone: 'danger', text: account.suspendReason === 'billing' ? ctx.t('suspendedBilling') : ctx.t('suspendedAdmin'), action: renew }];
  }
  if (account.status === 'pending') return [{ type: 'alert', tone: 'info', text: ctx.t('status.pending') }];
  if (account.status === 'deleted') return [{ type: 'alert', tone: 'info', text: ctx.t('deletedBanner') }];
  const days = daysLeft(account.paidUntil);
  if (days === null || days > 7 || !renew) return [];
  return [{ type: 'alert', tone: 'warn', text: days >= 0 ? ctx.t('expiresSoon', { days }) : ctx.t('expiredGrace', { days: -days }), action: renew }];
}

/** Показники: тариф, строк, диск, сайти */
function accountStats(ctx: UiContext, account: AccountView, links: AccountLinks): UiNode {
  const usage = account.usage;
  const days = daysLeft(account.paidUntil);
  return {
    type: 'stats',
    items: [
      {
        label: ctx.t('col.plan'),
        icon: 'layers',
        tone: 'blue',
        value: account.plan?.name ?? account.package ?? '—',
        hint: account.plan ? [ui.money(account.plan.price, config.currency), ` ${ctx.t('perMonth')}`] : undefined,
        href: links.active && account.plan ? `${links.base}?panel=plan` : undefined,
      },
      {
        label: ctx.t('paidUntilField'),
        icon: 'calendar',
        tone: accountTone(account),
        value: account.status === 'pending' ? '—' : account.paidUntil ? ui.date(account.paidUntil) : ctx.t('noTerm'),
        hint: days === null ? undefined : days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -days }),
        href: links.canRenew ? `${links.base}?panel=renew` : undefined,
      },
      {
        label: ctx.t('col.disk'),
        icon: 'monitor',
        tone: 'purple',
        value: formatSize(usage.diskUsedMb),
        progress: percent(usage.diskUsedMb, usage.diskLimitMb),
        hint: usage.diskLimitMb
          ? ctx.t('diskOf', { limit: formatSize(usage.diskLimitMb), free: freeSize(usage.diskUsedMb, usage.diskLimitMb) })
          : ctx.t('unlimited'),
      },
      {
        label: ctx.t('col.sites'),
        icon: 'apps',
        tone: 'slate',
        value: `${usage.sitesUsed ?? '—'} / ${usage.sitesLimit ?? '∞'}`,
        progress: percent(usage.sitesUsed, usage.sitesLimit),
        hint: usage.sitesLimit ? undefined : ctx.t('unlimited'),
        href: links.active ? `${links.base}?tab=sites` : undefined,
      },
    ],
  };
}

function closeButton(ctx: UiContext, base: string): UiNode {
  return { type: 'button', variant: 'link', label: ctx.t('close'), href: base };
}

/** Продовження: строк (з сумою на картці) і підсумок */
function renewPanel(ctx: UiContext, account: AccountView, links: AccountLinks): UiNode {
  const price = Number(account.plan!.price);
  const months = periods().includes(Number(ctx.state.months)) ? Number(ctx.state.months) : 1;
  return panel(ctx.t('renewTitle'), [{
    type: 'form',
    fields: [{
      name: 'months',
      kind: 'choice',
      value: String(months),
      live: true,
      options: periods().map((period) => ({
        value: String(period),
        label: ctx.t('months', { count: period }),
        lines: [ui.money((price * period).toFixed(2), config.currency)],
      })),
    }],
    footer: [ui.text(ui.money((price * months).toFixed(2), config.currency), { size: 'xl', bold: true })],
    submit: {
      label: ctx.t('payRenew'),
      action: { method: 'POST', url: `${links.url}/renew`, success: { notice: ctx.t('renewed'), redirect: links.base } },
    },
  }], { actions: [closeButton(ctx, links.base)] });
}

/** Зміна тарифу: картки тарифів, поточний позначено */
async function planPanel(ctx: UiContext, account: AccountView, links: AccountLinks): Promise<UiNode> {
  const { plans } = await hosting.orders.catalog(ctx.userId);
  const currency = config.currency;
  return panel(ctx.t('changePlan'), [
    {
      type: 'grid',
      min: 200,
      children: plans.map((plan): UiNode => ui.panel(plan.name, [
        ui.text([ui.money(plan.price, currency), ` ${ctx.t('perMonth')}`], { bold: true }),
        ...(plan.diskMb ? [ui.muted(`${ctx.t('disk')}: ${formatSize(plan.diskMb)}`)] : []),
        ui.muted(`${ctx.t('sitesCount')}: ${plan.sites ?? '∞'}`),
        plan.id === account.plan!.id
          ? ui.badge(ctx.t('current'), 'blue')
          : {
            type: 'button',
            variant: 'ghost',
            label: ctx.t('choose'),
            action: {
              method: 'POST',
              url: `${links.url}/plan`,
              body: { planId: plan.id },
              confirm: ctx.t('changePlanConfirm', { plan: plan.name }),
              success: { notice: ctx.t('planChangedCharged', { amount: `{charged} ${currency}` }), redirect: links.base },
            },
          },
      ])),
    },
    ui.muted(ctx.t('changePlanHint')),
  ], { actions: [closeButton(ctx, links.base)] });
}

const CABINET_TABS = ['overview', 'sites', 'dns', 'mail', 'databases', 'ftp', 'ssl', 'cron', 'settings'] as const;
type CabinetTab = (typeof CABINET_TABS)[number];

const SECTIONS: Record<Exclude<CabinetTab, 'overview' | 'settings'>, PanelSectionRenderer> = {
  sites: sitesSection,
  dns: dnsSection,
  mail: mailSection,
  databases: databasesSection,
  ftp: ftpSection,
  ssl: sslSection,
  cron: cronSection,
};

/** Огляд: швидкий старт (переходи до розділів) і дані доступу */
function overviewNodes(ctx: UiContext, account: AccountView, base: string): UiNode[] {
  const step = (icon: string, label: string, text: string, tab: string) => ({ icon, label, text, href: `${base}?tab=${tab}` });
  const server = account.server;
  return [
    panel(ctx.t('quickStart'), [{
      type: 'shortcuts',
      items: [
        step('apps', ctx.t('qs.site'), ctx.t('qs.siteText'), 'sites'),
        step('list', ctx.t('qs.dns'), ctx.t('qs.dnsText'), 'dns'),
        step('bell', ctx.t('qs.mail'), ctx.t('qs.mailText'), 'mail'),
        step('layers', ctx.t('qs.db'), ctx.t('qs.dbText'), 'databases'),
        step('upload', ctx.t('qs.ftp'), ctx.t('qs.ftpText'), 'ftp'),
        step('clock', ctx.t('qs.cron'), ctx.t('qs.cronText'), 'cron'),
      ],
    }], { subtitle: ctx.t('quickStartHint', { login: account.login }) }),
    panel(ctx.t('access'), [{
      type: 'fields',
      items: [
        { label: ctx.t('panelLogin'), value: { b: account.login } },
        { label: ctx.t('server'), value: countryName(server?.location, ctx.lang) },
        ...(server?.ipv4.length ? [{ label: 'IPv4', value: server.ipv4.join(', ') }] : []),
        ...(server?.ipv6.length ? [{ label: 'IPv6', value: server.ipv6.join(', ') }] : []),
        { label: ctx.t('createdAt'), value: ui.date(account.createdAt) },
        { label: ctx.t('autoRenew'), value: account.autoRenew ? ctx.t('on') : ctx.t('off') },
        ...(account.usage.updatedAt ? [{ label: ctx.t('usageAt'), value: { type: 'datetime' as const, value: new Date(account.usage.updatedAt).toISOString() } }] : []),
      ],
    }], { subtitle: ctx.t('accessHint') }),
  ];
}

/** Налаштування: автопродовження, пароль панелі, видалення */
function settingsNodes(ctx: UiContext, url: string, account: AccountView): UiNode[] {
  return [
    panel(ctx.t('autoRenew'), [
      ui.row([
        ui.badge(account.autoRenew ? ctx.t('on') : ctx.t('off'), account.autoRenew ? 'green' : 'slate'),
        {
          type: 'button',
          variant: 'ghost',
          label: account.autoRenew ? ctx.t('autoRenewDisable') : ctx.t('autoRenewEnable'),
          action: { method: 'PATCH', url, body: { autoRenew: !account.autoRenew } },
        },
      ], 'between'),
    ], { subtitle: ctx.t('autoRenewHint') }),
    panel(ctx.t('panelPassword'), [{
      type: 'form',
      fields: [{ name: 'password', kind: 'password', label: ctx.t('newPassword'), required: true, minlength: 10, autocomplete: 'new-password', grow: true, hint: ctx.t('passwordHint') }],
      submit: { label: ctx.t('save'), variant: 'ghost', action: { method: 'POST', url: `${url}/password`, success: { notice: ctx.t('passwordChanged') } } },
    }]),
    panel(ctx.t('danger'), [{
      type: 'form',
      fields: [{ name: 'confirm', kind: 'text', label: ctx.t('deleteType', { login: account.login }), required: true, autocomplete: 'off', grow: true }],
      submit: {
        label: ctx.t('delete'),
        variant: 'danger',
        action: { method: 'DELETE', url, confirm: ctx.t('deleteConfirm', { login: account.login }), success: { redirect: '/app/hosting?tab=deleted' } },
      },
    }], { subtitle: ctx.t('deleteHint') }),
  ];
}

export const cabinetPages = [list, order, account];
