/** Внесок журналу дій в огляд адмінки: останні події (право logs:view) */
import { hooks } from '../../../flowaxy/hooks/index.js';
import { isEnabled } from '../../../flowaxy/plugins/index.js';
import { use } from '../../../flowaxy/services/index.js';
import { describeAgent, tx, withMessages, type DashboardSection } from '../../../flowaxy/ui/index.js';
import { ActivityLog } from '../model.js';
import { activityParams } from '../service.js';
import { messages } from './messages.js';


/** Кабінет: останні власні дії */
function registerCabinet(): void {
  hooks.addFilter('ui.dashboard', async (sections, { ctx: base, area }): Promise<DashboardSection[]> => {
    if (area !== 'cabinet') return sections;
    const ctx = withMessages(base, messages);
    const events = await ActivityLog.findAll({ where: { userId: ctx.userId }, order: [['id', 'DESC']], limit: 5 });
    const params = await activityParams(events);
    return [...sections, {
      order: 60,
      panels: [{
        type: 'panel',
        title: ctx.t('dash.recent'),
        flush: true,
        actions: [{ type: 'button', variant: 'ghost', label: ctx.t('common.viewAll'), href: '/app/activity' }],
        children: [{
          type: 'datagrid',
          columns: [
            { key: 'action', label: ctx.t('activity.action') },
            { key: 'date', label: ctx.t('common.date'), align: 'right' },
          ],
          rows: events.map((row) => ({
            key: row.id,
            cells: {
              action: [
                { type: 'text', text: tx(ctx, `activity.${row.action}`, row.action, params.get(row.id)) },
                // Звідки: пристрій і IP (як у журналі)
                ...(row.ip || row.userAgent ? [{ type: 'text' as const, text: [describeAgent(row.userAgent), row.ip ? ` · ${row.ip}` : ''].join(''), tone: 'muted' as const, size: 'sm' as const }] : []),
              ],
              date: [{ type: 'text', text: { type: 'datetime', value: row.createdAt }, tone: 'muted', size: 'sm' }],
            },
          })),
          empty: ctx.t('activity.empty'),
        }],
      }],
    }];
  }, { owner: 'activity', when: () => isEnabled('activity') });
}

export function registerActivityDashboard(): void {
  registerCabinet();
  hooks.addFilter('ui.dashboard', async (sections, { ctx: base, area }): Promise<DashboardSection[]> => {
    if (area !== 'admin' || !base.can('logs', 'view')) return sections;
    const ctx = withMessages(base, messages);
    const events = await ActivityLog.findAll({ order: [['id', 'DESC']], limit: 6 });
    const params = await activityParams(events);
    const people = await use('users').byIds(events.map((row) => row.userId)).catch(() => new Map());

    return [...sections, {
      order: 50,
      panels: [{
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
          rows: events.map((row) => ({
            key: row.id,
            tone: row.action.startsWith('admin.') ? 'warn' as const : undefined,
            cells: {
              action: [
                { type: 'text', text: tx(ctx, `activity.${row.action}`, row.action, params.get(row.id)) },
                { type: 'text', text: people.get(row.userId)?.email ?? '—', tone: 'muted', size: 'sm' },
              ],
              date: [{ type: 'text', text: { type: 'datetime', value: row.createdAt }, tone: 'muted' }],
            },
          })),
          empty: ctx.t('activity.empty'),
        }],
      }],
    }];
  }, { owner: 'activity', when: () => isEnabled('activity') });
}
