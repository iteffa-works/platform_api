/** Адмінка → Панель: показники, останні користувачі й останні дії (за правами) */
import type { UiContext, UiNode, UiPage } from '../../../core/ui/index.js';
import { ActivityLog } from '../../activity/model.js';
import { avatarUrl } from '../../auth/core/index.js';
import { Role } from '../../auth/models/role.js';
import { User } from '../../auth/models/user.js';
import { overview } from '../overview.js';
import { roleLabel, tx } from './kit.js';

async function render(ctx: UiContext) {
  const [data, me] = await Promise.all([overview(), User.findByPk(ctx.userId, { include: [{ model: Role, as: 'role' }] })]);
  const canUsers = ctx.can('users', 'view');
  const canLogs = ctx.can('logs', 'view');

  const [latest, events] = await Promise.all([
    canUsers ? User.findAll({ include: [{ model: Role, as: 'role' }], order: [['id', 'DESC']], limit: 6 }) : Promise.resolve([]),
    canLogs
      ? ActivityLog.findAll({ include: [{ model: User, as: 'user', attributes: ['id', 'email'] }], order: [['id', 'DESC']], limit: 6 })
      : Promise.resolve([]),
  ]);

  const nodes: UiNode[] = [
    { type: 'heading', text: ctx.t('admin.welcome', { name: me?.name?.trim() || me?.email || '' }) },
    {
      type: 'stats',
      items: [
        { label: ctx.t('nav.users'), value: String(data.users.total), hint: ctx.t('admin.stat.thisMonth', { count: data.users.thisMonth }), icon: 'users', tone: 'blue', href: canUsers ? '/admin/users' : undefined },
        { label: ctx.t('nav.roles'), value: String(data.roles.total), hint: ctx.t('admin.stat.custom', { count: data.roles.custom }), icon: 'key', tone: 'purple', href: ctx.can('roles', 'view') ? '/admin/roles' : undefined },
        { label: ctx.t('admin.stat.resources'), value: String(data.resources), hint: ctx.t('admin.stat.resourcesNote'), icon: 'shield', tone: 'orange' },
        {
          label: ctx.t('admin.stat.yourRole'),
          value: me?.role ? roleLabel(ctx, me.role) : '—',
          hint: me?.role?.permissions['*'] ? ctx.t('admin.stat.allRights') : ctx.t('admin.stat.byLevels'),
          icon: 'user',
          tone: 'green',
        },
      ],
    },
  ];

  const columns: UiNode[] = [];
  if (canUsers) {
    columns.push({
      type: 'panel',
      title: ctx.t('admin.latestUsers'),
      flush: true,
      actions: [{ type: 'button', label: ctx.t('common.viewAll'), variant: 'link', href: '/admin/users' }],
      children: [{
        type: 'datagrid',
        columns: [
          { key: 'user', label: ctx.t('users.user') },
          { key: 'role', label: ctx.t('overview.role') },
          { key: 'created', label: ctx.t('common.registered'), align: 'right' },
        ],
        rows: latest.map((user) => ({
          key: user.id,
          cells: {
            user: [{ type: 'person', name: user.name?.trim() || user.email, caption: user.name?.trim() ? user.email : undefined, seed: user.email, src: avatarUrl(user.avatar) }],
            role: [{ type: 'badge', text: user.role ? roleLabel(ctx, user.role) : '—', tone: user.role?.isSystem ? 'blue' : 'purple' }],
            created: [{ type: 'text', text: { type: 'date', value: user.createdAt }, tone: 'muted' }],
          },
        })),
      }],
    });
  }
  if (canLogs) {
    columns.push({
      type: 'panel',
      title: ctx.t('admin.latestActivity'),
      flush: true,
      actions: [{ type: 'button', label: ctx.t('common.viewAll'), variant: 'link', href: '/admin/activity' }],
      children: [{
        type: 'datagrid',
        columns: [
          { key: 'action', label: ctx.t('activity.action') },
          { key: 'date', label: ctx.t('common.date'), align: 'right' },
        ],
        rows: events.map((row) => {
          let meta: Record<string, string | number> = {};
          try {
            meta = row.meta ? JSON.parse(row.meta) : {};
          } catch {
            /* пошкоджений meta — без параметрів */
          }
          return {
            key: row.id,
            tone: row.action.startsWith('admin.') ? 'warn' as const : undefined,
            cells: {
              action: [
                { type: 'text', text: tx(ctx, `activity.${row.action}`, row.action, meta) },
                { type: 'text', text: row.user?.email ?? '—', tone: 'muted', size: 'sm' },
              ],
              date: [{ type: 'text', text: { type: 'datetime', value: row.createdAt }, tone: 'muted' }],
            },
          };
        }),
        empty: ctx.t('activity.empty'),
      }],
    });
  }
  if (columns.length) nodes.push({ type: 'grid', min: 420, children: columns });

  return { nodes };
}

export const overviewPage: UiPage = {
  path: '/admin',
  section: 'admin',
  title: 'nav.dashboard',
  permission: ['admin.panel', 'view'],
  render,
};
