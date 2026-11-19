/** Адмінка → Ролі: матриця «роль × розділ», редагування прав і видалення в діалогах, нова роль у шапці */
import { isWithin, permissionCatalog } from '../../../flowaxy/access/index.js';
import { permissionsOf } from '../access.js';
import { DEVELOPER_ROLE } from '../models/role.js';
import { listRoles } from '../admin/roles.service.js';
import { act, lines, type Tone, tx, type UiButton, type UiContext, type UiNode, type UiPage } from '../../../flowaxy/ui/index.js';
import { roleLabel } from './kit.js';

type RoleRow = Awaited<ReturnType<typeof listRoles>>['roles'][number];

const LEVEL_TONE: Record<string, Tone> = { view: 'blue', edit: 'orange', manage: 'green' };

async function render(ctx: UiContext) {
  const [{ roles }, actor] = await Promise.all([listRoles(), permissionsOf(ctx.req)]);
  const resources = Object.entries(permissionCatalog()).map(([key, definition]) => ({ key, ...definition }));
  const canManage = ctx.can('roles', 'manage');
  const levelName = (level: string) => ctx.t(`level.${level}`);
  const resourceName = (key: string, label: string) => tx(ctx, `resource.${key}`, label);

  /** Роль, якою можна керувати: не розробник і права в межах власних */
  const editable = (role: RoleRow) => canManage && role.slug !== DEVELOPER_ROLE && isWithin(role.permissions, actor);

  function editDialog(role: RoleRow): UiButton {
    return act(ctx.t('admin.roles.edit'), 'sliders', {
      dialog: {
        title: ctx.t('admin.roles.editTitle', { role: roleLabel(ctx, role) }),
        nodes: [{
          type: 'form',
          layout: 'stack',
          fields: resources.map((resource) => ({
            name: `perm.${resource.key}`,
            kind: 'select' as const,
            label: resourceName(resource.key, resource.label),
            value: role.permissions[resource.key] ?? 'none',
            options: ['none', ...resource.levels].map((level) => ({ value: level, label: levelName(level) })),
          })),
          submit: {
            label: ctx.t('common.save'),
            action: { method: 'PATCH', url: `/admin/roles/${role.id}`, success: { notice: ctx.t('admin.roles.saved') } },
          },
        }],
      },
    });
  }

  function deleteDialog(role: RoleRow): UiButton {
    const targets = roles.filter((item) => item.id !== role.id && item.slug !== DEVELOPER_ROLE);
    const name = roleLabel(ctx, role);
    return act(ctx.t('common.delete'), 'trash', {
      variant: 'danger',
      dialog: {
        title: ctx.t('roles.deleteConfirm', { role: name }),
        nodes: [{
          type: 'form',
          layout: 'stack',
          fields: [{
            name: 'reassignTo',
            kind: 'select',
            label: ctx.t('admin.roles.reassign', { count: role.users }),
            value: String(targets.find((item) => item.slug === 'user')?.id ?? targets[0]?.id ?? ''),
            options: targets.map((item) => ({ value: String(item.id), label: roleLabel(ctx, item) })),
          }],
          submit: {
            label: ctx.t('common.delete'),
            variant: 'danger',
            action: { method: 'DELETE', url: `/admin/roles/${role.id}`, success: { notice: ctx.t('admin.roles.deleted') } },
          },
        }],
      },
    });
  }

  function levelCell(role: RoleRow, key: string): UiNode[] {
    if (role.slug === DEVELOPER_ROLE || role.permissions['*']) return [{ type: 'badge', text: ctx.t('roles.all'), tone: 'green' }];
    const level = role.permissions[key];
    return level ? [{ type: 'badge', text: levelName(level), tone: LEVEL_TONE[level] ?? 'slate' }] : [{ type: 'text', text: '—', tone: 'muted' }];
  }

  const nodes: UiNode[] = [{
    type: 'datagrid',
    columns: [
      { key: 'role', label: ctx.t('overview.role') },
      { key: 'users', label: ctx.t('roles.usersShort'), align: 'right', width: '1%' },
      ...resources.map((resource) => ({ key: `r:${resource.key}`, label: resourceName(resource.key, resource.label), align: 'center' as const })),
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    rows: roles.map((role) => ({
      key: role.id,
      tone: role.slug === DEVELOPER_ROLE ? 'muted' as const : undefined,
      cells: {
        role: lines(roleLabel(ctx, role), `${role.slug}${role.isSystem ? ` · ${ctx.t('roles.system')}` : ''}`),
        users: [{ type: 'link', text: String(role.users), href: `/admin/users?role=${role.slug}` }],
        ...Object.fromEntries(resources.map((resource) => [`r:${resource.key}`, levelCell(role, resource.key)])),
        actions: [{ type: 'actions', items: editable(role) ? [editDialog(role), ...(role.isSystem ? [] : [deleteDialog(role)])] : [] }],
      },
    })),
  }];

  const actions: UiButton[] = canManage
    ? [{
        type: 'button',
        label: ctx.t('roles.new'),
        icon: 'plus',
        dialog: {
          title: ctx.t('roles.new'),
          nodes: [
            { type: 'text', text: ctx.t('admin.roles.newHint'), tone: 'muted', size: 'sm' },
            {
              type: 'form',
              layout: 'stack',
              fields: [
                { name: 'name', kind: 'text', label: ctx.t('roles.name'), required: true },
                { name: 'slug', kind: 'text', label: ctx.t('roles.slug'), required: true, placeholder: 'support' },
              ],
              submit: { label: ctx.t('common.create'), action: { method: 'POST', url: '/admin/roles', success: { notice: ctx.t('admin.roles.created') } } },
            },
          ],
        },
      }]
    : [];

  return { nodes, actions };
}

export const rolesPage: UiPage = {
  path: '/admin/roles',
  section: 'admin',
  title: 'nav.roles',
  subtitle: 'roles.subtitle',
  permission: ['roles', 'view'],
  render,
};
