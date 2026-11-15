/** /admin/hosting/plans — тарифи: ціна за місяць → шаблон панелі; кількість акаунтів на тарифі */
import { col, fn } from 'sequelize';
import { config } from '../../../../../config/index.js';
import { ui, type UiButton, type UiPage } from '../../../../../core/ui/index.js';
import { HostingAccount } from '../../../domain/models.js';
import { hosting } from '../../../module.js';
import { formatSize } from '../../format.js';
import { datagrid, gridQuery, localGrid, searchBox } from '../../grid.js';
import { ADMIN, code, onOff } from '../../kit.js';

export const plansPage: UiPage = {
  path: `${ADMIN}/plans`,
  section: 'admin',
  title: 'nav.plans',
  subtitle: 'plans.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const manage = ctx.can('hosting', 'manage');
    const query = gridQuery(ctx.state, ['order', 'name', 'price', 'accounts'], 'order');
    const [plans, usage] = await Promise.all([
      hosting.plans.list(),
      HostingAccount.findAll({ attributes: ['planId', [fn('COUNT', col('id')), 'total']], where: { status: ['active', 'suspended'] }, group: ['planId'], raw: true }) as unknown as Promise<Array<{ planId: number; total: number | string }>>,
    ]);
    const accounts = new Map(usage.map((row) => [row.planId, Number(row.total)]));
    const page = localGrid(plans, query, {
      text: (plan) => `${plan.name} ${plan.slug} ${plan.package} ${plan.description ?? ''}`,
      sort: { order: (plan) => plan.sortOrder, name: (plan) => plan.name, price: (plan) => plan.priceCents, accounts: (plan) => accounts.get(plan.id) ?? 0 },
    });

    const actions: UiButton[] = [];
    if (manage) {
      // Підказки шаблонів — з першого активного сервера (кешовано; панель недоступна — без підказок)
      const server = (await hosting.servers.list()).servers.find((item) => item.isActive);
      const packages = server ? await hosting.servers.packages(server.id).then((data) => data.packages).catch(() => [] as string[]) : [];
      actions.push({
        type: 'button',
        label: ctx.t('addPlan'),
        icon: 'plus',
        dialog: {
          title: ctx.t('addPlan'),
          nodes: [{
            type: 'form',
            layout: 'stack',
            fields: [
              { name: 'name', kind: 'text', label: ctx.t('planName'), required: true },
              { name: 'slug', kind: 'text', label: ctx.t('planSlug'), required: true, placeholder: 'fast' },
              { name: 'price', kind: 'text', label: `${ctx.t('pricePerMonth')}, ${config.currency}`, required: true, placeholder: '150.00' },
              { name: 'package', kind: 'text', label: ctx.t('package'), required: true, options: packages.map((name) => ({ value: name, label: name })), hint: ctx.t('planHint') },
              { name: 'diskMb', kind: 'number', label: ctx.t('diskMb') },
              { name: 'sites', kind: 'number', label: ctx.t('sitesCount') },
              { name: 'description', kind: 'text', label: ctx.t('description') },
              { name: 'sortOrder', kind: 'number', label: ctx.t('sortOrder'), value: String(plans.length + 1) },
            ],
            submit: { label: ctx.t('create'), action: { method: 'POST', url: `${ADMIN}/plans`, success: { notice: ctx.t('saved') } } },
          }],
        },
      });
    }

    const grid = datagrid({
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
        return {
          key: plan.id,
          tone: plan.isActive ? undefined : 'muted' as const,
          cells: {
            name: [ui.text({ b: plan.name }), ui.muted(plan.description ? `${plan.slug} · ${plan.description}` : plan.slug)],
            price: [ui.text(ui.money(plan.price, config.currency), { bold: true })],
            package: [code(plan.package)],
            limits: [ui.muted(`${formatSize(plan.diskMb)} · ${ctx.t('sitesCount')}: ${plan.sites ?? '∞'}`)],
            accounts: [ui.text(String(accounts.get(plan.id) ?? 0))],
            status: [onOff(ctx, plan.isActive)],
            actions: [{
              type: 'actions',
              items: [
                { type: 'button', label: ctx.t('price'), icon: 'wallet', action: { method: 'PATCH', url, prompt: { message: ctx.t('pricePrompt'), field: 'price', value: plan.price } } },
                { type: 'button', label: ctx.t('package'), icon: 'edit', action: { method: 'PATCH', url, prompt: { message: ctx.t('packagePrompt'), field: 'package', value: plan.package } } },
                { type: 'button', label: plan.isActive ? ctx.t('disable') : ctx.t('enable'), icon: plan.isActive ? 'lock' : 'check', action: { method: 'PATCH', url, body: { isActive: !plan.isActive } } },
                ...(accounts.get(plan.id) ? [] : [{ type: 'button' as const, label: ctx.t('delete'), icon: 'trash', variant: 'danger' as const, action: { method: 'DELETE' as const, url, confirm: ctx.t('deletePlanConfirm', { plan: plan.name }) } }]),
              ],
            }],
          },
        };
      }),
      empty: ctx.t('noPlans'),
    });
    return { nodes: [grid], actions };
  },
};
