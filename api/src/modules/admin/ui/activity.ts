/** Адмінка → Журнал дій: пошук за email, фільтр за користувачем (?user=), групи дій, пагінація */
import { Op, type WhereOptions } from 'sequelize';
import type { UiContext, UiNode, UiPage } from '../../../core/ui/index.js';
import { ActivityLog } from '../../activity/model.js';
import { avatarUrl } from '../../auth/core/index.js';
import { User } from '../../auth/models/user.js';
import { describeAgent, gridState, likeOf, pageOf, tx } from './kit.js';

/** Групи дій (сегменти): префікс ключа дії */
const GROUPS: Record<string, string[]> = {
  auth: ['auth.', 'session.', 'password.'],
  profile: ['profile.', 'avatar.', 'referral.'],
  admin: ['admin.', 'role.'],
  billing: ['plan.', 'balance.'],
};

function params(meta: string | null): Record<string, string | number> {
  if (!meta) return {};
  try {
    const value = JSON.parse(meta) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === 'number' ? item : String(item)]));
  } catch {
    return {};
  }
}

async function render(ctx: UiContext) {
  const grid = gridState(ctx.state, ['date'], '-date');
  const query = (ctx.state.q ?? '').trim().slice(0, 100);
  const group = GROUPS[ctx.state.group ?? ''] ? ctx.state.group! : '';
  const userId = Number(ctx.state.user) || null;

  const where: WhereOptions<ActivityLog> = {};
  if (userId) Object.assign(where, { userId });
  if (group) Object.assign(where, { [Op.or]: GROUPS[group]!.map((prefix) => ({ action: { [Op.like]: `${prefix}%` } })) });

  const [filtered, { rows, count }] = await Promise.all([
    userId ? User.findByPk(userId, { attributes: ['id', 'email'] }) : Promise.resolve(null),
    ActivityLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'name', 'avatar'],
        ...(query ? { where: { email: { [Op.like]: likeOf(query) } }, required: true } : {}),
      }],
      order: [['id', grid.sort.dir === 'asc' ? 'ASC' : 'DESC']],
      limit: grid.perPage,
      offset: grid.offset,
    }),
  ]);

  const nodes: UiNode[] = [];
  if (userId) {
    nodes.push({
      type: 'alert',
      tone: 'info',
      text: [ctx.t('admin.activity.byUser'), ' ', { b: filtered?.email ?? `#${userId}` }],
      action: { type: 'button', label: ctx.t('admin.grid.reset'), variant: 'link', href: '/admin/activity' },
    });
  }

  nodes.push({
    type: 'datagrid',
    toolbar: {
      segments: {
        name: 'group',
        value: group,
        items: [
          { label: ctx.t('common.viewAll'), value: '' },
          ...Object.keys(GROUPS).map((key) => ({ label: ctx.t(`admin.activity.group.${key}`), value: key })),
        ],
      },
      search: { name: 'q', value: query, placeholder: ctx.t('activity.filter') },
    },
    columns: [
      { key: 'date', label: ctx.t('common.date'), sortable: true, width: '1%' },
      { key: 'user', label: ctx.t('users.user') },
      { key: 'action', label: ctx.t('activity.action') },
      { key: 'ip', label: 'IP' },
      { key: 'device', label: ctx.t('security.device') },
    ],
    sort: grid.sort,
    rows: rows.map((row) => ({
      key: row.id,
      tone: row.action.startsWith('admin.') ? 'warn' as const : undefined,
      cells: {
        date: [{ type: 'text', text: { type: 'datetime', value: row.createdAt }, tone: 'muted' }],
        user: row.user
          ? [{ type: 'person', name: row.user.name?.trim() || row.user.email, caption: row.user.name?.trim() ? row.user.email : undefined, seed: row.user.email, src: avatarUrl(row.user.avatar), href: `/admin/activity?user=${row.user.id}` }]
          : [{ type: 'text', text: '—', tone: 'muted' }],
        action: [{ type: 'text', text: tx(ctx, `activity.${row.action}`, row.action, params(row.meta)) }],
        ip: [{ type: 'code', text: row.ip ?? '—' }],
        device: [{ type: 'text', text: describeAgent(row.userAgent), tone: 'muted' }],
      },
    })),
    page: pageOf(ctx, grid, count),
    empty: query || group || userId ? ctx.t('admin.grid.nothing') : ctx.t('activity.empty'),
  });

  return { nodes };
}

export const activityPage: UiPage = {
  path: '/admin/activity',
  section: 'admin',
  title: 'nav.activityAdmin',
  subtitle: 'activity.adminSubtitle',
  permission: ['logs', 'view'],
  render,
};
