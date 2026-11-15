/** Адмінка → Користувачі: пошук, сегменти за ролями, сортування й пагінація на сервері, зміна ролі */
import { col, fn, Op, type WhereOptions } from 'sequelize';
import { isWithin } from '../../../core/access/index.js';
import type { UiButton, UiContext, UiNode, UiPage } from '../../../core/ui/index.js';
import { permissionsOf } from '../../auth/access.js';
import { avatarUrl } from '../../auth/core/index.js';
import { DEVELOPER_ROLE, Role } from '../../auth/models/role.js';
import { User } from '../../auth/models/user.js';
import { act, gridState, likeOf, pageOf, roleLabel } from './kit.js';

/** Ключ сортування → колонка */
const SORT: Record<string, string> = { created: 'createdAt', email: 'email', id: 'id' };

async function render(ctx: UiContext) {
  const grid = gridState(ctx.state, Object.keys(SORT), '-created');
  const query = (ctx.state.q ?? '').trim().slice(0, 100);
  const roleSlug = ctx.state.role ?? '';

  const [roles, counts, actor] = await Promise.all([
    Role.findAll({ order: [['isSystem', 'DESC'], ['name', 'ASC']] }),
    User.findAll({ attributes: ['roleId', [fn('COUNT', col('id')), 'total']], group: ['roleId'], raw: true }) as unknown as Promise<
      Array<{ roleId: number; total: number | string }>
    >,
    permissionsOf(ctx.req),
  ]);
  const role = roles.find((item) => item.slug === roleSlug);
  const countOf = new Map(counts.map((row) => [row.roleId, Number(row.total)]));
  const everyone = counts.reduce((sum, row) => sum + Number(row.total), 0);

  const where: WhereOptions<User> = {};
  if (query) Object.assign(where, { [Op.or]: [{ email: { [Op.like]: likeOf(query) } }, { name: { [Op.like]: likeOf(query) } }] });
  if (role) Object.assign(where, { roleId: role.id });

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ model: Role, as: 'role' }],
    order: [[SORT[grid.sort.key]!, grid.sort.dir === 'desc' ? 'DESC' : 'ASC']],
    limit: grid.perPage,
    offset: grid.offset,
  });

  const canManage = ctx.can('users', 'manage');
  const canLogs = ctx.can('logs', 'view');
  /** Ролі, які можна призначити: не розробник і в межах власних прав */
  const assignable = roles.filter((item) => item.slug !== DEVELOPER_ROLE && isWithin(item.permissions, actor));

  function actionsOf(user: User): UiButton[] {
    const items: UiButton[] = [];
    const locked = user.id === ctx.userId || user.role?.slug === DEVELOPER_ROLE || !isWithin(user.role?.permissions ?? {}, actor);
    if (canManage && !locked) {
      const title = ctx.t('admin.users.changeRoleOf', { email: user.email });
      items.push(act(ctx.t('admin.users.changeRole'), 'key', {
        dialog: {
          title,
          nodes: [{
            type: 'form',
            layout: 'stack',
            fields: [{
              name: 'roleId',
              kind: 'select',
              label: ctx.t('overview.role'),
              value: String(user.role?.id ?? ''),
              options: assignable.map((item) => ({ value: String(item.id), label: roleLabel(ctx, item) })),
            }],
            submit: {
              label: ctx.t('common.save'),
              action: { method: 'PATCH', url: `/admin/users/${user.id}`, success: { notice: ctx.t('admin.users.roleChanged') } },
            },
          }],
        },
      }));
    }
    if (canLogs) items.push(act(ctx.t('nav.activityAdmin'), 'list', { href: `/admin/activity?user=${user.id}` }));
    return items;
  }

  const nodes: UiNode[] = [{
    type: 'datagrid',
    toolbar: {
      segments: {
        name: 'role',
        value: role?.slug ?? '',
        items: [
          { label: ctx.t('common.viewAll'), value: '', count: everyone },
          ...roles.filter((item) => countOf.get(item.id)).map((item) => ({ label: roleLabel(ctx, item), value: item.slug, count: countOf.get(item.id) })),
        ],
      },
      search: { name: 'q', value: query, placeholder: ctx.t('admin.users.search') },
    },
    columns: [
      { key: 'id', label: '#', width: '1%', sortable: true },
      { key: 'email', label: ctx.t('users.user'), sortable: true },
      { key: 'role', label: ctx.t('overview.role') },
      { key: 'twoFactor', label: '2FA', align: 'center', width: '1%' },
      { key: 'created', label: ctx.t('common.registered'), sortable: true },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    sort: grid.sort,
    rows: rows.map((user) => ({
      key: user.id,
      tone: user.id === ctx.userId ? 'success' as const : undefined,
      cells: {
        id: [{ type: 'text', text: String(user.id), tone: 'muted' }],
        email: [{
          type: 'person',
          name: user.name?.trim() || user.email,
          caption: user.name?.trim() ? user.email : user.id === ctx.userId ? ctx.t('users.you') : undefined,
          seed: user.email,
          src: avatarUrl(user.avatar),
        }],
        role: [{ type: 'badge', text: user.role ? roleLabel(ctx, user.role) : '—', tone: user.role?.slug === DEVELOPER_ROLE ? 'green' : user.role?.isSystem ? 'blue' : 'purple' }],
        twoFactor: [{ type: 'icon', name: user.twoFactorSecret ? 'shield' : 'close', size: 16 }],
        created: [{ type: 'text', text: { type: 'date', value: user.createdAt } }],
        actions: [{ type: 'actions', items: actionsOf(user) }],
      },
    })),
    page: pageOf(ctx, grid, count),
    empty: query || role ? ctx.t('admin.grid.nothing') : ctx.t('users.empty'),
  }];

  return { nodes };
}

export const usersPage: UiPage = {
  path: '/admin/users',
  section: 'admin',
  title: 'nav.users',
  subtitle: 'users.subtitle',
  permission: ['users', 'view'],
  render,
};
