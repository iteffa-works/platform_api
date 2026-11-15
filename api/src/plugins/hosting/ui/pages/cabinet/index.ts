/** Сторінки кабінету: список, замовлення, картка акаунта (лише власні акаунти) */
import { config } from '../../../../../config/index.js';
import { ui, type UiContext, type UiNode, type UiPage } from '../../../../../core/ui/index.js';
import { HttpError } from '../../../../../shared/http/index.js';
import { hosting } from '../../../module.js';
import { accountTone, countryName, formatSize, freeSize, paidLabel, percent, type AccountView } from '../../format.js';
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

/* ---------- /app/hosting ---------- */

const list: UiPage = {
  path: '/app/hosting',
  section: 'cabinet',
  title: 'nav.hosting',
  async render(ctx) {
    const deleted = ctx.state.tab === 'deleted';
    const { accounts } = await hosting.accounts.listMine(ctx.userId);
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

    return [{
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
            lines: [
              [ui.money(item.price, currency), ` ${ctx.t('perMonth')}`],
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
          hint: ctx.t('accountNameHint'),
        },
      ],
      footer: [
        ui.panel(ctx.t('step.pay'), [
          ui.row([
            ui.text(`${plan.name} · ${ctx.t('months', { count: months })}`),
            ui.text(ui.money(total, currency), { size: 'xl', bold: true }),
            ui.text([`${ctx.t('balance')}: `, ui.money(catalog.balance, currency)], { tone: 'muted' }),
          ]),
          ...(enough ? [] : [ui.row([ui.text(ctx.t('notEnough'), { tone: 'warn', bold: true }), { type: 'link', text: ctx.t('topUp'), href: '/app/billing' }])]),
        ]),
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
    const { account } = await hosting.accounts.viewMine(ctx.userId, id);
    const base = `/app/hosting/${id}`;
    const url = `${C}/${id}`;
    const currency = config.currency;
    const usage = account.usage;
    const active = account.status === 'active';
    const canRenew = Boolean(account.plan) && (active || account.suspendReason === 'billing');

    const nodes: UiNode[] = [];
    if (account.status === 'suspended') {
      nodes.push({ type: 'banner', tone: 'red', text: account.suspendReason === 'billing' ? ctx.t('suspendedBilling') : ctx.t('suspendedAdmin') });
    } else if (account.status === 'pending') {
      nodes.push({ type: 'banner', text: ctx.t('status.pending') });
    } else if (account.status === 'deleted') {
      nodes.push({ type: 'banner', text: ctx.t('deletedBanner') });
    }

    nodes.push({
      type: 'grid',
      min: 280,
      children: [
        {
          type: 'tile',
          tone: 'blue',
          media: { type: 'status', tone: 'blue', icon: 'server' },
          children: [
            { type: 'heading', text: `${ctx.t('account')}: ${account.login}` },
            ...(account.status === 'deleted' ? [] : [noteButton(ctx, account)]),
            ui.text([{ b: `${ctx.t('col.plan')}: ` }, account.plan?.name ?? account.package ?? '—']),
            ui.text(paidLabel(ctx, account), { size: 'sm' }),
            ...(active && account.plan ? [{ type: 'button' as const, variant: 'link' as const, label: `${ctx.t('changePlan')} →`, href: `${base}?panel=plan` }] : []),
          ],
          footer: { type: 'button', label: ctx.t('renew'), icon: 'wallet', href: `${base}?panel=renew`, disabled: !canRenew },
        },
        {
          type: 'tile',
          tone: 'green',
          media: { type: 'ring', value: percent(usage.diskUsedMb, usage.diskLimitMb), size: 56 },
          children: [
            { type: 'heading', text: ctx.t('col.disk') },
            ui.text([{ b: `${ctx.t('volume')}: ` }, `${formatSize(usage.diskUsedMb)} ${ctx.t('of')} ${formatSize(usage.diskLimitMb)}`]),
            ui.text([{ b: `${ctx.t('col.sites')}: ` }, `${usage.sitesUsed ?? '—'} ${ctx.t('of')} ${usage.sitesLimit ?? '∞'}`]),
            ui.text([{ b: `${ctx.t('free')}: ` }, freeSize(usage.diskUsedMb, usage.diskLimitMb)]),
            ...(usage.updatedAt ? [ui.text([ctx.t('updatedAt', { date: '' }), { type: 'datetime' as const, value: usage.updatedAt }], { size: 'sm' })] : []),
          ],
          footer: { type: 'button', label: ctx.t('refresh'), icon: 'clock', disabled: !active, action: { method: 'POST', url: `${url}/usage` } },
        },
        {
          type: 'tile',
          tone: 'slate',
          media: { type: 'flag', code: account.server?.location ?? null, size: 56, round: true },
          children: [
            { type: 'heading', text: `${ctx.t('col.location')}: ${countryName(account.server?.location, ctx.lang)}` },
            ...(account.server?.ipv4.length ? [ui.text([{ b: 'IPv4: ' }, account.server.ipv4.join(', ')])] : []),
            ...(account.server?.ipv6.length ? [ui.text([{ b: 'IPv6: ' }, account.server.ipv6.join(', ')])] : []),
          ],
          footer: { type: 'button', label: ctx.t('openPanel'), icon: 'arrow', disabled: !active, action: { method: 'POST', url: `${url}/login`, openUrl: 'url', success: { reload: false } } },
        },
      ],
    });

    // Продовження
    if (ctx.state.panel === 'renew' && canRenew && account.plan) {
      const months = periods().includes(Number(ctx.state.months)) ? Number(ctx.state.months) : 1;
      const total = (Number(account.plan.price) * months).toFixed(2);
      nodes.push(ui.panel(ctx.t('renewTitle'), [{
        type: 'form',
        fields: [{
          name: 'months',
          kind: 'choice',
          value: String(months),
          live: true,
          options: periods().map((period) => ({ value: String(period), label: ctx.t('months', { count: period }) })),
        }],
        footer: [ui.text(ui.money(total, currency), { size: 'xl', bold: true })],
        submit: {
          label: ctx.t('payRenew'),
          action: { method: 'POST', url: `${url}/renew`, success: { notice: ctx.t('renewed'), redirect: base } },
        },
      }]));
    }

    // Зміна тарифу
    if (ctx.state.panel === 'plan' && active && account.plan) {
      const { plans } = await hosting.orders.catalog(ctx.userId);
      nodes.push(ui.panel(ctx.t('changePlan'), [
        {
          type: 'grid',
          min: 200,
          children: plans.map((plan): UiNode => ui.panel(plan.name, [
            ui.text([ui.money(plan.price, currency), ` ${ctx.t('perMonth')}`]),
            ...(plan.diskMb ? [ui.muted(`${ctx.t('disk')}: ${formatSize(plan.diskMb)}`)] : []),
            plan.id === account.plan!.id
              ? ui.badge(ctx.t('current'), 'blue')
              : {
                type: 'button',
                variant: 'ghost',
                label: ctx.t('choose'),
                action: {
                  method: 'POST',
                  url: `${url}/plan`,
                  body: { planId: plan.id },
                  confirm: ctx.t('changePlanConfirm', { plan: plan.name }),
                  success: { notice: ctx.t('planChangedCharged', { amount: `{charged} ${currency}` }), redirect: base },
                },
              },
          ])),
        },
        ui.muted(ctx.t('changePlanHint')),
      ]));
    }

    if (!active) return nodes;

    /* Вкладки керування: ті самі розділи, що й у консолі адміністратора, — з власником = цей акаунт */
    const tab = (CABINET_TABS as readonly string[]).includes(ctx.state.tab ?? '') ? ctx.state.tab as CabinetTab : 'overview';
    nodes.push({
      type: 'tabs',
      items: CABINET_TABS.map((item) => ({ label: ctx.t(`tab.${item}`), href: item === 'overview' ? base : `${base}?tab=${item}`, active: item === tab })),
    });

    if (tab === 'overview') {
      nodes.push(...quickStart(ctx, base, account));
      return nodes;
    }
    if (tab === 'settings') {
      nodes.push(...settingsNodes(ctx, url, account));
      return nodes;
    }

    // Розділ панелі: перевірка «свій, активний, сервер увімкнено» + ліміт запитів
    const owned = await hosting.accounts.usable(ctx.userId, id);
    const scope = new PanelScope(ctx, owned.serverId, { api: `${url}/panel`, page: base, owner: owned.panelUser, manage: true });
    try {
      nodes.push(...(await SECTIONS[tab](scope)));
    } catch (error) {
      if (error instanceof HttpError && error.status !== 502) throw error;
      nodes.push({ type: 'banner', tone: 'orange', text: ctx.t('panelError', { error: error instanceof Error ? error.message : '' }) });
    }
    return nodes;
  },
};

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

/** Швидкий старт: що робити з новим хостингом — крок за кроком */
function quickStart(ctx: UiContext, base: string, account: AccountView): UiNode[] {
  const step = (icon: string, title: string, text: string, tab: string, label: string): UiNode => ui.panel(undefined, [
    ui.row([{ type: 'status', tone: 'blue', icon }, ui.stack([ui.text({ b: title }), ui.muted(text)], 2)]),
    { type: 'button', variant: 'ghost', label, href: `${base}?tab=${tab}` },
  ]);
  return [
    ui.panel(ctx.t('quickStart'), [ui.muted(ctx.t('quickStartHint', { login: account.login }))]),
    {
      type: 'grid',
      min: 240,
      children: [
        step('apps', ctx.t('qs.site'), ctx.t('qs.siteText'), 'sites', ctx.t('tab.sites')),
        step('list', ctx.t('qs.dns'), ctx.t('qs.dnsText'), 'dns', ctx.t('tab.dns')),
        step('bell', ctx.t('qs.mail'), ctx.t('qs.mailText'), 'mail', ctx.t('tab.mail')),
        step('layers', ctx.t('qs.db'), ctx.t('qs.dbText'), 'databases', ctx.t('tab.databases')),
        step('upload', ctx.t('qs.ftp'), ctx.t('qs.ftpText'), 'ftp', ctx.t('tab.ftp')),
        step('clock', ctx.t('qs.cron'), ctx.t('qs.cronText'), 'cron', ctx.t('tab.cron')),
      ],
    },
  ];
}

/** Налаштування: автопродовження, пароль панелі, видалення */
function settingsNodes(ctx: UiContext, url: string, account: AccountView): UiNode[] {
  return [
    ui.panel(ctx.t('settings'), [
      ui.row([
        ui.text(ctx.t('autoRenewState', { state: account.autoRenew ? ctx.t('on') : ctx.t('off') }), { bold: true }),
        {
          type: 'button',
          variant: 'ghost',
          label: account.autoRenew ? ctx.t('autoRenewDisable') : ctx.t('autoRenewEnable'),
          action: { method: 'PATCH', url, body: { autoRenew: !account.autoRenew } },
        },
      ]),
      ui.muted(ctx.t('autoRenewHint')),
      {
        type: 'form',
        fields: [{ name: 'password', kind: 'password', label: ctx.t('newPassword'), required: true, minlength: 10, autocomplete: 'new-password', grow: true, hint: ctx.t('passwordHint') }],
        submit: { label: ctx.t('save'), variant: 'ghost', action: { method: 'POST', url: `${url}/password`, success: { notice: ctx.t('passwordChanged') } } },
      },
    ]),
    ui.panel(ctx.t('danger'), [{
      type: 'form',
      fields: [{ name: 'confirm', kind: 'text', label: ctx.t('deleteType', { login: account.login }), required: true, autocomplete: 'off', grow: true, hint: ctx.t('deleteHint') }],
      submit: {
        label: ctx.t('delete'),
        variant: 'danger',
        action: { method: 'DELETE', url, confirm: ctx.t('deleteConfirm', { login: account.login }), success: { redirect: '/app/hosting?tab=deleted' } },
      },
    }]),
  ];
}

export const cabinetPages = [list, order, account];
