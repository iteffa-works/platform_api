/** Адмінка → Журнал дій: пошук за email, фільтр за користувачем (?user=), групи дій, пагінація */
import { Op, type WhereOptions } from 'sequelize';
import { ActivityLog } from '../model.js';
import { activityParams } from '../service.js';
import { use } from '../../../flowaxy/services/index.js';
import { describeAgent, gridQuery, pageInfo, person, tx, type UiContext, type UiNode, type UiPage } from '../../../flowaxy/ui/index.js';

/** Групи дій (сегменти): префікс ключа дії */
const GROUPS: Record<string, string[]> = {
  auth: ['auth.', 'session.', 'password.'],
  profile: ['profile.', 'avatar.', 'referral.'],
  admin: ['admin.', 'role.'],
  billing: ['plan.', 'balance.'],
};

async function render(ctx: UiContext) {
  const grid = gridQuery(ctx.state, ['date'], '-date');
  const query = (ctx.state.q ?? '').trim().slice(0, 100);
  const group = GROUPS[ctx.state.group ?? ''] ? ctx.state.group! : '';
  const userId = Number(ctx.state.user) || null;

  const users = use('users');
  const where: WhereOptions<ActivityLog> = {};
  // Пошук за email — id власників з порту users
  if (userId) Object.assign(where, { userId });
  else if (query) Object.assign(where, { userId: { [Op.in]: await users.idsByEmailLike(query) } });
  if (group) Object.assign(where, { [Op.or]: GROUPS[group]!.map((prefix) => ({ action: { [Op.like]: `${prefix}%` } })) });

  const { rows, count } = await ActivityLog.findAndCountAll({
    where,
    order: [['id', grid.sort.dir === 'asc' ? 'ASC' : 'DESC']],
    limit: grid.perPage,
    offset: grid.offset,
  });
  const params = await activityParams(rows);
  const people = await users.byIds([...rows.map((row) => row.userId), ...(userId ? [userId] : [])]);
  const filtered = userId ? people.get(userId) : null;

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
        user: people.has(row.userId)
          ? [person(people.get(row.userId)!, `/admin/activity?user=${row.userId}`)]
          : [{ type: 'text', text: '—', tone: 'muted' }],
        action: [{ type: 'text', text: tx(ctx, `activity.${row.action}`, row.action, params.get(row.id)) }],
        ip: [{ type: 'code', text: row.ip ?? '—' }],
        device: [{ type: 'text', text: describeAgent(row.userAgent), tone: 'muted' }],
      },
    })),
    page: pageInfo(ctx, grid, count),
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
