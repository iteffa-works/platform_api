/** /admin/hosting/plans — тарифи: ціна за місяць → шаблон панелі */
import { config } from '../../../../../config/index.js';
import { ui, type UiNode, type UiPage } from '../../../../../core/ui/index.js';
import { hosting } from '../../../module.js';
import { formatSize } from '../../format.js';
import { action, ADMIN, code, dialogButton, menu, onOff, panel, removeAction, table } from '../../kit.js';

export const plansPage: UiPage = {
  path: `${ADMIN}/plans`,
  section: 'admin',
  title: 'nav.plans',
  subtitle: 'plans.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const manage = ctx.can('hosting', 'manage');
    const plans = await hosting.plans.list();
    const actions: UiNode[] = [];

    if (manage) {
      // Підказки шаблонів — з першого активного сервера (панель недоступна — без підказок)
      const server = (await hosting.servers.list()).servers.find((item) => item.isActive);
      const packages = server ? await hosting.servers.packages(server.id).then((data) => data.packages).catch(() => [] as string[]) : [];
      actions.push(dialogButton(ctx.t('addPlan'), ctx.t('addPlan'), [{
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
        ],
        submit: { label: ctx.t('create'), action: { method: 'POST', url: `${ADMIN}/plans`, success: { notice: ctx.t('saved') } } },
      }]));
    }

    return [panel(`${ctx.t('plans')} · ${plans.length}`, [table(
      [
        { key: 'plan', label: ctx.t('col.plan') },
        { key: 'price', label: ctx.t('pricePerMonth'), align: 'right' },
        { key: 'package', label: ctx.t('package') },
        { key: 'limits', label: ctx.t('limits') },
        { key: 'status', label: ctx.t('status') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      plans.map((plan) => {
        const url = `${ADMIN}/plans/${plan.id}`;
        return {
          key: plan.id,
          muted: !plan.isActive,
          cells: {
            plan: [ui.text({ b: plan.name }), ui.muted(plan.description ? `${plan.slug} · ${plan.description}` : plan.slug)],
            price: [ui.text(ui.money(plan.price, config.currency), { bold: true })],
            package: [code(plan.package)],
            limits: [ui.muted(`${formatSize(plan.diskMb)} · ${ctx.t('sitesCount')}: ${plan.sites ?? '∞'}`)],
            status: [onOff(ctx, plan.isActive)],
            actions: manage ? [menu([
              action(ctx.t('price'), { method: 'PATCH', url, prompt: { message: ctx.t('pricePrompt'), field: 'price', value: plan.price } }),
              action(ctx.t('package'), { method: 'PATCH', url, prompt: { message: ctx.t('packagePrompt'), field: 'package', value: plan.package } }),
              action(plan.isActive ? ctx.t('disable') : ctx.t('enable'), { method: 'PATCH', url, body: { isActive: !plan.isActive } }),
              removeAction(ctx.t('delete'), url, ctx.t('deletePlanConfirm', { plan: plan.name })),
            ])] : [],
          },
        };
      }),
      ctx.t('noPlans'),
    )], { flush: true, actions })];
  },
};
