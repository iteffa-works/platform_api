/** Адмінка → Панель: привітання, показники й панелі — внески плагінів (фільтр `ui.dashboard`) */
import { permissionCatalog } from '../../../flowaxy/access/index.js';
import { available, use } from '../../../flowaxy/services/index.js';
import { collectDashboard, type UiContext, type UiNode, type UiPage } from '../../../flowaxy/ui/index.js';

async function render(ctx: UiContext) {
  const [me, { stats, panels }] = await Promise.all([
    available('users') ? use('users').byIds([ctx.userId]).then((users) => users.get(ctx.userId)) : Promise.resolve(undefined),
    collectDashboard(ctx, 'admin'),
  ]);

  const nodes: UiNode[] = [
    { type: 'heading', text: ctx.t('admin.welcome', { name: me?.name?.trim() || me?.email || '' }) },
    {
      type: 'stats',
      items: [
        ...stats,
        { label: ctx.t('admin.stat.resources'), value: String(Object.keys(permissionCatalog()).length), hint: ctx.t('admin.stat.resourcesNote'), icon: 'shield', tone: 'orange' },
      ],
    },
  ];
  if (panels.length) nodes.push({ type: 'grid', min: 420, children: panels });
  return { nodes };
}

export const overviewPage: UiPage = {
  path: '/admin',
  section: 'admin',
  title: 'nav.dashboard',
  permission: ['admin.panel', 'view'],
  render,
};
