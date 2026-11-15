/** Адмінка → Плагіни: addon вмикаються без перезапуску (меню оновлюється одразу), модулі ядра — список */
import { listPlugins } from '../../../core/plugins/index.js';
import type { UiContext, UiNode, UiPage } from '../../../core/ui/index.js';
import { lines } from './kit.js';

async function render(ctx: UiContext) {
  const plugins = listPlugins();
  const addons = plugins.filter((plugin) => plugin.kind === 'addon');
  const core = plugins.filter((plugin) => plugin.kind === 'core');
  const canManage = ctx.can('plugins', 'manage');

  const nodes: UiNode[] = [
    {
      type: 'stats',
      items: [
        { label: ctx.t('plugins.addons'), value: String(addons.length), hint: ctx.t('admin.plugins.enabledCount', { count: addons.filter((plugin) => plugin.enabled).length }), icon: 'plug', tone: 'purple' },
        { label: ctx.t('plugins.coreModules'), value: String(core.length), hint: ctx.t('plugins.alwaysOn'), icon: 'layers', tone: 'blue' },
      ],
    },
    {
      type: 'panel',
      title: ctx.t('plugins.addons'),
      flush: true,
      children: [{
        type: 'datagrid',
        columns: [
          { key: 'plugin', label: ctx.t('plugins.plugin') },
          { key: 'status', label: ctx.t('plugins.status') },
          { key: 'actions', label: '', align: 'right', width: '1%' },
        ],
        rows: addons.map((plugin) => ({
          key: plugin.name,
          tone: plugin.enabled ? undefined : 'muted' as const,
          cells: {
            plugin: [
              ...lines(plugin.title, `${plugin.name}${plugin.version ? ` · v${plugin.version}` : ''}`),
              ...(plugin.description ? [{ type: 'text' as const, text: plugin.description, tone: 'muted' as const, size: 'sm' as const }] : []),
            ],
            status: [{ type: 'badge', text: plugin.enabled ? ctx.t('plugins.enabled') : ctx.t('plugins.disabled'), tone: plugin.enabled ? 'green' : 'slate' }],
            actions: canManage
              ? [{
                  type: 'button',
                  label: plugin.enabled ? ctx.t('plugins.disable') : ctx.t('plugins.enable'),
                  variant: plugin.enabled ? 'ghost' : 'primary',
                  action: {
                    method: 'PATCH',
                    url: `/admin/plugins/${encodeURIComponent(plugin.name)}`,
                    body: { enabled: !plugin.enabled },
                    confirm: plugin.enabled ? ctx.t('plugins.disableConfirm', { plugin: plugin.title }) : undefined,
                    success: { manifest: true },
                  },
                }]
              : [],
          },
        })),
        empty: ctx.t('plugins.empty'),
      }],
    },
    {
      type: 'panel',
      title: ctx.t('plugins.coreModules'),
      flush: true,
      children: [{
        type: 'datagrid',
        columns: [
          { key: 'plugin', label: ctx.t('plugins.plugin') },
          { key: 'kind', label: ctx.t('plugins.kind') },
        ],
        rows: core.map((plugin) => ({
          key: plugin.name,
          cells: {
            plugin: lines(plugin.title, plugin.name),
            kind: [{ type: 'badge', text: ctx.t('plugins.core'), tone: 'blue' }, { type: 'text', text: ctx.t('plugins.alwaysOn'), tone: 'muted', size: 'sm' }],
          },
        })),
      }],
    },
  ];

  return { nodes };
}

export const pluginsPage: UiPage = {
  path: '/admin/plugins',
  section: 'admin',
  title: 'nav.plugins',
  subtitle: 'plugins.subtitle',
  permission: ['plugins', 'view'],
  render,
};
