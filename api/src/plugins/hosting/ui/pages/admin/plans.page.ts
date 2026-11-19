/**
 * /admin/hosting/plans — тарифи й шаблони панелі.
 * Шаблони користувачів ISPmanager приходять синхронізацією (копія в БД); тариф створюється з шаблону,
 * ліміти вітрини (диск, сайти) оновлюються з шаблону автоматично. Попередження — шаблону тарифу немає на сервері.
 */
import { col, fn } from 'sequelize';
import { config } from '../../../../../config/index.js';
import { ui, type UiButton, type UiContext, type UiField, type UiNode, type UiPage } from '../../../../../flowaxy/ui/index.js';
import { HostingAccount } from '../../../domain/models.js';
import { hosting } from '../../../module.js';
import type { PanelPackage } from '../../../providers/contracts.js';
import type { PlanTemplate } from '../../../services/plan.service.js';
import type { PlanView } from '../../../services/presenter.js';
import { formatSize } from '../../format.js';
import { datagrid, gridQuery, localGrid, searchBox } from '../../grid.js';
import { ADMIN, badge, code, onOff, panel } from '../../kit.js';

/** Кількість з шаблону: null — без обмеження, 0 — заборонено */
function amount(ctx: UiContext, value: number | null): string {
  return value === null ? '∞' : value === 0 ? ctx.t('forbidden') : String(value);
}

function size(ctx: UiContext, value: number | null): string {
  return value === null ? '∞' : value === 0 ? ctx.t('forbidden') : formatSize(value);
}

/**
 * Пропозиція для форми тарифу з шаблону: ключ — з імені (`flx-host-plus` → plus),
 * назва й опис — з коментаря панелі («Plus - Кілька сайтів» / «Flowaxy Plus»).
 */
function suggestion(template: PanelPackage) {
  const slug = template.name.replace(/^flx-[a-z]+-/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^[^a-z]+/, '').slice(0, 32) || 'plan';
  const comment = (template.comment ?? '').replace(/\s+/g, ' ').trim();
  const [head = '', ...rest] = comment.split(/\s+[-–—|]\s+/);
  const name = head.replace(/^flowaxy\s+/i, '').trim() || slug.charAt(0).toUpperCase() + slug.slice(1);
  return { slug, name: name.slice(0, 80), description: rest.join(' — ').slice(0, 255) };
}

/** Поля форми тарифу; шаблон — вибір з наявних (якщо є) */
function planFields(ctx: UiContext, templates: Map<string, PlanTemplate>, preset: Partial<{ name: string; slug: string; description: string; package: string; diskMb: number | null; sites: number | null; sortOrder: number }>): UiField[] {
  const names = [...templates.keys()].sort();
  return [
    { name: 'name', kind: 'text', label: ctx.t('planName'), required: true, value: preset.name ?? '' },
    { name: 'slug', kind: 'text', label: ctx.t('planSlug'), required: true, placeholder: 'plus', value: preset.slug ?? '' },
    { name: 'price', kind: 'text', label: `${ctx.t('pricePerMonth')}, ${config.currency}`, required: true, placeholder: '119.00', hint: ctx.t('priceFreeHint') },
    names.length
      ? { name: 'package', kind: 'select', label: ctx.t('package'), required: true, value: preset.package ?? names[0], options: names.map((name) => ({ value: name, label: templates.get(name)!.template.comment ? `${name} · ${templates.get(name)!.template.comment}` : name })), hint: ctx.t('limitsFromTemplate') }
      : { name: 'package', kind: 'text', label: ctx.t('package'), required: true, value: preset.package ?? '', hint: ctx.t('planHint') },
    { name: 'diskMb', kind: 'number', label: ctx.t('diskMb'), value: preset.diskMb ? String(Math.round(preset.diskMb)) : '' },
    { name: 'sites', kind: 'number', label: ctx.t('sitesCount'), value: preset.sites !== null && preset.sites !== undefined ? String(preset.sites) : '' },
    { name: 'description', kind: 'text', label: ctx.t('description'), value: preset.description ?? '' },
    { name: 'sortOrder', kind: 'number', label: ctx.t('sortOrder'), value: String(preset.sortOrder ?? 0) },
  ];
}

function planDialog(ctx: UiContext, label: string, title: string, fields: UiField[], variant: UiButton['variant'] = 'primary', icon = 'plus'): UiButton {
  return {
    type: 'button',
    label,
    icon,
    variant,
    dialog: {
      title,
      nodes: [{ type: 'form', layout: 'stack', fields, submit: { label: ctx.t('create'), action: { method: 'POST', url: `${ADMIN}/plans`, success: { notice: ctx.t('saved') } } } }],
    },
  };
}

/** Можливості шаблону бейджами */
function features(ctx: UiContext, template: PanelPackage): UiNode {
  const items = ([['backup', ctx.t('feature.backup')], ['ssh', 'SSH'], ['git', 'Git'], ['nodejs', 'Node.js'], ['ssl', 'SSL']] as const)
    .filter(([key]) => template.features[key])
    .map(([, label]) => badge(label, 'blue'));
  return items.length ? ui.row(items) : ui.muted('—');
}

/** Шаблон тарифу на серверах: немає ніде / не на всіх увімкнених */
function coverage(ctx: UiContext, plan: PlanView, templates: Map<string, PlanTemplate>, servers: Array<{ id: number; name: string }>): UiNode[] {
  const entry = templates.get(plan.package);
  if (!servers.length) return [];
  if (!entry) return [badge(ctx.t('templateMissingAll'), 'red')];
  const missing = servers.filter((server) => !entry.servers.includes(server.id));
  return missing.length ? [badge(ctx.t('templateMissing', { servers: missing.map((server) => server.name).join(', ') }), 'orange')] : [];
}

export const plansPage: UiPage = {
  path: `${ADMIN}/plans`,
  section: 'admin',
  title: 'nav.plans',
  subtitle: 'plans.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const manage = ctx.can('hosting', 'manage');
    const query = gridQuery(ctx.state, ['order', 'name', 'price', 'accounts'], 'order');
    const [plans, usage, templates, { servers }] = await Promise.all([
      hosting.plans.list(),
      HostingAccount.findAll({ attributes: ['planId', [fn('COUNT', col('id')), 'total']], where: { status: ['active', 'suspended'] }, group: ['planId'], raw: true }) as unknown as Promise<Array<{ planId: number; total: number | string }>>,
      hosting.plans.templates(),
      hosting.servers.list(),
    ]);
    const activeServers = servers.filter((server) => server.isActive);
    const accounts = new Map(usage.map((row) => [row.planId, Number(row.total)]));
    const planByPackage = new Map(plans.map((plan) => [plan.package, plan]));
    const page = localGrid(plans, query, {
      text: (plan) => `${plan.name} ${plan.slug} ${plan.package} ${plan.description ?? ''}`,
      sort: { order: (plan) => plan.sortOrder, name: (plan) => plan.name, price: (plan) => plan.priceCents, accounts: (plan) => accounts.get(plan.id) ?? 0 },
    });

    const actions: UiButton[] = [
      { type: 'button', variant: 'ghost', label: ctx.t('syncTemplates'), icon: 'refresh', action: { method: 'POST', url: `${ADMIN}/plans/sync`, success: { notice: ctx.t('templatesSynced', { templates: '{templates}', updated: '{updated}' }) } } },
      ...(manage ? [planDialog(ctx, ctx.t('addPlan'), ctx.t('addPlan'), planFields(ctx, templates, { sortOrder: plans.length + 1 }))] : []),
    ];

    const nodes: UiNode[] = [];
    if (activeServers.length && !templates.size) nodes.push({ type: 'alert', tone: 'warn', text: ctx.t('noTemplates') });

    nodes.push(datagrid({
      ctx,
      query: page.query,
      total: page.total,
      toolbar: { search: searchBox(ctx, query) },
      columns: [
        { key: 'name', label: ctx.t('col.plan'), sortable: true },
        { key: 'price', label: ctx.t('pricePerMonth'), align: 'right', sortable: true },
        { key: 'package', label: ctx.t('package') },
        { key: 'limits', label: ctx.t('limits') },
        { key: 'accounts', label: ctx.t('accounts'), align: 'right', sortable: true },
        { key: 'status', label: ctx.t('status') },
        ...(manage ? [{ key: 'actions', label: '', align: 'right' as const, width: '1%' }] : []),
      ],
      rows: page.rows.map((plan) => {
        const url = `${ADMIN}/plans/${plan.id}`;
        const template = templates.get(plan.package)?.template;
        const problems = coverage(ctx, plan, templates, activeServers);
        return {
          key: plan.id,
          tone: !plan.isActive ? 'muted' as const : problems.length ? 'warn' as const : undefined,
          cells: {
            name: [ui.row([ui.text({ b: plan.name }), ...(plan.isFeatured ? [badge(ctx.t('featured'), 'orange')] : [])]), ui.muted(plan.description ? `${plan.slug} · ${plan.description}` : plan.slug)],
            price: [ui.text(Number(plan.price) === 0 ? ctx.t('priceFree') : ui.money(plan.price, config.currency), { bold: true })],
            package: [code(plan.package), ...problems],
            limits: [
              ui.muted(`${ctx.t('disk')}: ${formatSize(plan.diskMb)} · ${ctx.t('sitesCount')}: ${plan.sites ?? '∞'}`),
              ...(template ? [ui.muted(`${ctx.t('databases')}: ${amount(ctx, template.databases)} · ${ctx.t('mailboxesShort')}: ${amount(ctx, template.mailboxes)}`)] : []),
            ],
            accounts: [ui.text(String(accounts.get(plan.id) ?? 0))],
            status: [onOff(ctx, plan.isActive)],
            actions: [{
              type: 'actions',
              items: [
                { type: 'button', label: ctx.t('price'), icon: 'wallet', action: { method: 'PATCH', url, prompt: { message: ctx.t('pricePrompt'), field: 'price', value: plan.price } } },
                { type: 'button', label: ctx.t('package'), icon: 'edit', action: { method: 'PATCH', url, prompt: { message: ctx.t('packagePrompt'), field: 'package', value: plan.package } } },
                { type: 'button', label: plan.isFeatured ? ctx.t('unfeature') : ctx.t('makeFeatured'), icon: 'gift', variant: plan.isFeatured ? 'primary' : 'ghost', action: { method: 'PATCH', url, body: { isFeatured: !plan.isFeatured } } },
                { type: 'button', label: plan.isActive ? ctx.t('disable') : ctx.t('enable'), icon: plan.isActive ? 'lock' : 'check', action: { method: 'PATCH', url, body: { isActive: !plan.isActive } } },
                ...(accounts.get(plan.id) ? [] : [{ type: 'button' as const, label: ctx.t('delete'), icon: 'trash', variant: 'danger' as const, action: { method: 'DELETE' as const, url, confirm: ctx.t('deletePlanConfirm', { plan: plan.name }) } }]),
              ],
            }],
          },
        };
      }),
      empty: ctx.t('noPlans'),
    }));

    // Шаблони панелі: ліміти, можливості, повʼязаний тариф або «Створити тариф»
    const serverName = new Map(servers.map((server) => [server.id, server.name]));
    const list = [...templates.values()].sort((left, right) => left.template.name.localeCompare(right.template.name, undefined, { numeric: true }));
    nodes.push(panel(`${ctx.t('templates')} · ${list.length}`, [datagrid({
      ctx,
      paged: false,
      columns: [
        { key: 'name', label: ctx.t('package') },
        { key: 'disk', label: ctx.t('disk') },
        { key: 'sites', label: ctx.t('sitesCount') },
        { key: 'db', label: ctx.t('databases') },
        { key: 'mail', label: ctx.t('mailboxesShort') },
        { key: 'features', label: ctx.t('features') },
        { key: 'plan', label: ctx.t('col.plan') },
        { key: 'actions', label: '', align: 'right', width: '1%' },
      ],
      rows: list.map(({ template, servers: on }) => {
        const plan = planByPackage.get(template.name);
        const offer = suggestion(template);
        return {
          key: template.name,
          tone: plan ? undefined : 'muted' as const,
          cells: {
            name: [code(template.name), ui.muted([template.comment ?? '', template.comment ? ' · ' : '', on.map((id) => serverName.get(id) ?? `#${id}`).join(', ')])],
            disk: [ui.text(size(ctx, template.diskMb), { size: 'sm' })],
            sites: [ui.text(amount(ctx, template.sites), { size: 'sm' })],
            db: [ui.text(amount(ctx, template.databases), { size: 'sm' })],
            mail: [ui.text(amount(ctx, template.mailboxes), { size: 'sm' })],
            features: [features(ctx, template)],
            plan: plan
              ? [ui.row([ui.text({ b: plan.name }), ...(plan.isActive ? [] : [badge(ctx.t('off'))])])]
              : manage
                ? [planDialog(ctx, ctx.t('createPlan'), ctx.t('planFromTemplate', { name: template.name }), planFields(ctx, templates, {
                  ...offer, package: template.name, diskMb: template.diskMb, sites: template.sites, sortOrder: plans.length + 1,
                }), 'ghost')]
                : [ui.muted('—')],
            actions: [{
              type: 'actions',
              items: [{
                type: 'button',
                label: ctx.t('panelFields'),
                icon: 'list',
                dialog: {
                  title: `${ctx.t('panelFields')} · ${template.name}`,
                  nodes: [{ type: 'fields', items: Object.entries(template.limits).map(([key, value]) => ({ label: key, value: value || '∞' })) }, ui.muted(ctx.t('panelFieldsHint'))],
                },
              }],
            }],
          },
        };
      }),
      empty: activeServers.length ? ctx.t('noTemplates') : ctx.t('noServers'),
    })], { flush: true, subtitle: ctx.t('templatesHint', { minutes: hosting.config.jobIntervalMinutes }) }));

    return { nodes, actions };
  },
};
