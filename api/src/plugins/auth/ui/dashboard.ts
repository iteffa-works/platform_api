/** Внесок auth в огляд адмінки: користувачі, ролі, роль поточного користувача, останні реєстрації */
import { Op } from 'sequelize';
import { hooks } from '../../../flowaxy/hooks/index.js';
import { isEnabled } from '../../../flowaxy/plugins/index.js';
import { person, withMessages, type DashboardSection, type DashboardStat, type UiNode } from '../../../flowaxy/ui/index.js';
import { avatarUrl } from '../core/index.js';
import { Role } from '../models/role.js';
import { User } from '../models/user.js';
import { listActiveSessions } from '../sessions.js';
import { roleLabel } from './kit.js';
import { messages } from './messages.js';

/** Кабінет: профіль і безпека, нагадування про 2FA, адмінка для персоналу */
function registerCabinet(): void {
  hooks.addFilter('ui.dashboard', async (sections, { ctx: base, area }): Promise<DashboardSection[]> => {
    if (area !== 'cabinet') return sections;
    const ctx = withMessages(base, messages);
    const [me, sessions] = await Promise.all([
      User.findByPk(ctx.userId, { attributes: ['id', 'twoFactorSecret'] }),
      listActiveSessions(ctx.userId),
    ]);
    const twoFactor = Boolean(me?.twoFactorSecret);
    // Картка «Безпека» праворуч: 2FA, активні сесії; без 2FA — тон попередження й кнопка ввімкнення
    const panel: UiNode = {
      type: 'panel',
      title: ctx.t('dash.security'),
      children: [
        {
          type: 'fields',
          items: [
            { label: ctx.t('dash.twofaLabel'), value: twoFactor ? ctx.t('dash.on') : ctx.t('dash.off') },
            { label: ctx.t('dash.sessions'), value: String(sessions.length) },
          ],
        },
        ...(twoFactor
          ? [{ type: 'button' as const, variant: 'ghost' as const, label: ctx.t('dash.manage'), href: '/app/security' }]
          : [
            { type: 'text' as const, text: ctx.t('dash.twofa'), tone: 'warn' as const, size: 'sm' as const },
            { type: 'button' as const, icon: 'lock', label: ctx.t('dash.twofaEnable'), href: '/app/security' },
          ]),
      ],
    };
    return [...sections, { order: 80, aside: [panel] }];
  }, { owner: 'auth', when: () => isEnabled('auth') });
}

export function registerAuthDashboard(): void {
  registerCabinet();
  hooks.addFilter('ui.dashboard', async (sections, { ctx: base, area }) => {
    if (area !== 'admin') return sections;
    const ctx = withMessages(base, messages);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const canUsers = ctx.can('users', 'view');

    const [me, total, thisMonth, roles, customRoles, latest] = await Promise.all([
      User.findByPk(ctx.userId, { include: [{ model: Role, as: 'role' }] }),
      User.count(),
      User.count({ where: { createdAt: { [Op.gte]: monthStart } } }),
      Role.count(),
      Role.count({ where: { isSystem: false } }),
      canUsers ? User.findAll({ include: [{ model: Role, as: 'role' }], order: [['id', 'DESC']], limit: 6 }) : Promise.resolve([]),
    ]);

    const stats: DashboardStat[] = [
      { label: ctx.t('nav.users'), value: String(total), hint: ctx.t('admin.stat.thisMonth', { count: thisMonth }), icon: 'users', tone: 'blue', href: canUsers ? '/admin/users' : undefined },
      { label: ctx.t('nav.roles'), value: String(roles), hint: ctx.t('admin.stat.custom', { count: customRoles }), icon: 'key', tone: 'purple', href: ctx.can('roles', 'view') ? '/admin/roles' : undefined },
      {
        label: ctx.t('admin.stat.yourRole'),
        value: me?.role ? roleLabel(ctx, me.role) : '—',
        hint: me?.role?.permissions['*'] ? ctx.t('admin.stat.allRights') : ctx.t('admin.stat.byLevels'),
        icon: 'user',
        tone: 'green',
      },
    ];

    const section: DashboardSection = { order: 10, stats };
    if (canUsers) {
      section.panels = [{
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
              user: [person({ id: user.id, email: user.email, name: user.name, avatarUrl: avatarUrl(user.avatar) })],
              role: [{ type: 'badge', text: user.role ? roleLabel(ctx, user.role) : '—', tone: user.role?.isSystem ? 'blue' : 'purple' }],
              created: [{ type: 'text', text: { type: 'date', value: user.createdAt }, tone: 'muted' }],
            },
          })),
        }],
      }];
    }
    return [...sections, section];
  }, { owner: 'auth', when: () => isEnabled('auth') });
}
