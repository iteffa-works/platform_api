/**
 * /admin/hosting/accounts/[id] — картка акаунта для керування: стан, власник, строк і тариф, блокування,
 * синхронізація, вхід у панель (підтримка), видалення. Ресурси — кількості з копії (керує ними клієнт).
 */
import { config } from '../../../../../config/index.js';
import { ui, type UiButton, type UiNode, type UiPage } from '../../../../../flowaxy/ui/index.js';
import { HttpError } from '../../../../../shared/http/index.js';
import { CLIENT_KINDS } from '../../../domain/models.js';
import { hosting } from '../../../module.js';
import { accountTone, countryName, daysLeft, formatSize, freeSize, percent } from '../../format.js';
import { ADMIN, badge, panel } from '../../kit.js';

export const accountPage: UiPage = {
  path: `${ADMIN}/accounts/[id]`,
  section: 'admin',
  title: 'account.title',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Хостинг-акаунт не знайдено');
    const manage = ctx.can('hosting', 'manage');
    const account = await hosting.accounts.view(id);
    const [counts, plans] = await Promise.all([
      account.serverId ? hosting.mirror.counts(account.serverId, account.login) : Promise.resolve({}),
      manage ? hosting.plans.list() : Promise.resolve([]),
    ]);
    const url = `${ADMIN}/accounts/${id}`;
    const deleted = account.status === 'deleted';
    const tone = accountTone(account);
    const days = daysLeft(account.paidUntil);
    const usage = account.usage;

    const nodes: UiNode[] = [
      { type: 'breadcrumbs', items: [{ label: ctx.t('section.accounts'), href: `${ADMIN}/accounts` }, { label: account.login }] },
      ui.row([
        { type: 'status', tone, icon: 'server' },
        ui.stack([
          ui.row([{ type: 'heading', text: account.login }, badge(ctx.t(`status.${account.status}`), tone)]),
          ui.row([
            ...(account.user ? [{ type: 'person' as const, name: account.user.email, caption: `${ctx.t('userId')}: ${account.user.id}`, seed: account.user.email }] : []),
            ...(account.server ? [{ type: 'link' as const, text: account.server.name, href: `${ADMIN}/servers/${account.serverId}?tab=users` }] : []),
          ]),
        ], 4),
      ]),
    ];

    if (account.status === 'suspended') {
      nodes.push({ type: 'alert', tone: 'danger', text: [{ b: `${ctx.t('suspendReason')}: ` }, ctx.t(`reason.${account.suspendReason ?? 'admin'}`)] });
    } else if (account.status === 'active' && days !== null && days <= 7) {
      nodes.push({ type: 'alert', tone: 'warn', text: days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -days }) });
    }

    nodes.push({
      type: 'stats',
      items: [
        { label: ctx.t('col.plan'), value: account.plan?.name ?? account.package ?? '—', hint: account.plan ? [ui.money(account.plan.price, config.currency), ` ${ctx.t('perMonth')}`] : undefined, icon: 'layers', tone: 'blue' },
        {
          label: ctx.t('paidUntilField'),
          value: account.paidUntil ? ui.date(account.paidUntil) : ctx.t('noTerm'),
          hint: days === null ? undefined : days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -days }),
          icon: 'calendar',
          tone,
        },
        {
          label: ctx.t('col.disk'),
          value: formatSize(usage.diskUsedMb),
          progress: percent(usage.diskUsedMb, usage.diskLimitMb),
          hint: usage.diskLimitMb ? ctx.t('diskOf', { limit: formatSize(usage.diskLimitMb), free: freeSize(usage.diskUsedMb, usage.diskLimitMb) }) : ctx.t('unlimited'),
          icon: 'monitor',
          tone: 'purple',
        },
        { label: ctx.t('col.sites'), value: `${usage.sitesUsed ?? '—'} / ${usage.sitesLimit ?? '∞'}`, progress: percent(usage.sitesUsed, usage.sitesLimit), icon: 'apps', tone: 'slate' },
      ],
    });

    // Керування: тариф, строк, автопродовження, примітка — одна форма (PATCH)
    const management: UiNode = manage && !deleted
      ? panel(ctx.t('management'), [{
        type: 'form',
        layout: 'stack',
        fields: [
          { name: 'planId', kind: 'select', label: ctx.t('col.plan'), value: account.plan ? String(account.plan.id) : '', options: [...(account.plan ? [] : [{ value: '', label: '—' }]), ...plans.map((plan) => ({ value: String(plan.id), label: `${plan.name} · ${plan.price} ${config.currency}` }))] },
          { name: 'paidUntil', kind: 'date', label: ctx.t('paidUntilField'), value: account.paidUntil ? new Date(account.paidUntil).toISOString().slice(0, 10) : '', hint: ctx.t('paidUntilHint') },
          { name: 'autoRenew', kind: 'checkbox', label: ctx.t('autoRenew'), value: account.autoRenew },
          { name: 'note', kind: 'text', label: ctx.t('note'), value: account.note ?? '' },
        ],
        submit: { label: ctx.t('save'), action: { method: 'PATCH', url, success: { notice: ctx.t('saved') } } },
      }], { subtitle: ctx.t('managementHint') })
      : panel(ctx.t('management'), [{
        type: 'fields',
        items: [
          { label: ctx.t('autoRenew'), value: account.autoRenew ? ctx.t('on') : ctx.t('off') },
          { label: ctx.t('note'), value: account.note ?? '—' },
        ],
      }]);

    const resources = panel(ctx.t('resources'), [{
      type: 'fields',
      items: CLIENT_KINDS.map((kind) => ({ label: ctx.t(`kind.${kind}`), value: String((counts as Record<string, number>)[kind] ?? 0) })),
    }], { subtitle: ctx.t('resourcesHint') });

    const access = panel(ctx.t('access'), [{
      type: 'fields',
      items: [
        { label: ctx.t('panelLogin'), value: { b: account.login } },
        { label: ctx.t('server'), value: account.server ? `${account.server.name} · ${countryName(account.server.location, ctx.lang)}` : '—' },
        ...(account.server?.ipv4.length ? [{ label: 'IPv4', value: account.server.ipv4.join(', ') }] : []),
        { label: ctx.t('createdAt'), value: ui.date(account.createdAt) },
        ...(usage.updatedAt ? [{ label: ctx.t('usageAt'), value: { type: 'datetime' as const, value: new Date(usage.updatedAt).toISOString() } }] : []),
      ],
    }]);

    nodes.push({ type: 'grid', min: 340, children: [management, ui.stack([resources, access], 16)] });

    if (manage && !deleted) {
      nodes.push(panel(ctx.t('danger'), [ui.row([
        { type: 'button', variant: 'ghost', label: ctx.t('deleteKeep'), action: { method: 'DELETE', url, body: { removeFromPanel: false }, confirm: ctx.t('adminDeleteConfirm', { login: account.login }), success: { redirect: `${ADMIN}/accounts` } } },
        { type: 'button', variant: 'danger', label: ctx.t('deleteWithPanel'), action: { method: 'DELETE', url, body: { removeFromPanel: true }, confirm: ctx.t('deleteFromPanelConfirm', { login: account.login }), success: { redirect: `${ADMIN}/accounts` } } },
      ])]));
    }

    // Дії в шапці сторінки
    const actions: UiButton[] = deleted ? [] : [
      { type: 'button', variant: 'ghost', label: ctx.t('sync'), icon: 'refresh', action: { method: 'POST', url: `${url}/sync`, success: { notice: ctx.t('saved') } } },
      ...(manage ? [
        account.status === 'suspended'
          ? { type: 'button' as const, variant: 'ghost' as const, label: ctx.t('resume'), icon: 'check', action: { method: 'POST' as const, url: `${url}/resume` } }
          : { type: 'button' as const, variant: 'ghost' as const, label: ctx.t('suspend'), icon: 'lock', disabled: account.status !== 'active', action: { method: 'POST' as const, url: `${url}/suspend`, confirm: ctx.t('suspendConfirm', { login: account.login }) } },
        { type: 'button' as const, label: ctx.t('loginAs'), icon: 'external', disabled: account.status !== 'active', action: { method: 'POST' as const, url: `${url}/login`, openUrl: 'url', success: { reload: false } } },
      ] : []),
    ];
    return { nodes, actions };
  },
};
