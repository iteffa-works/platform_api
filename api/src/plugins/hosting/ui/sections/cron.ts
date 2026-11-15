/** Планувальник (cron): розклад, команда, створення / видалення (службові завдання адміністратора — лише перегляд) */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import { code, dialogButton, onOff, panel } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const cronSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const jobs = await hosting.panel.cron(scope.serverId, scope.owner);

  const actions: UiNode[] = scope.manage ? [dialogButton(t('newCron'), t('newCron'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      await scope.ownerFieldWithOptions(),
      { name: 'schedule', kind: 'text', label: t('schedule'), required: true, value: '*/15 * * * *', hint: t('scheduleHint') },
      { name: 'command', kind: 'text', label: t('command'), required: true, autocomplete: 'off', placeholder: 'php ~/www/example.com/cron.php' },
      { name: 'description', kind: 'text', label: t('description') },
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/cron`, success: { notice: t('saved') } } },
  }])] : [];

  const grid = await scope.grid(jobs, {
    defaultSort: 'schedule',
    sort: { schedule: (job) => job.schedule, command: (job) => job.command, state: (job) => job.active },
    text: (job) => `${job.schedule} ${job.command} ${job.description ?? ''}`,
    columns: [
      { key: 'schedule', label: t('schedule'), width: '140px' },
      { key: 'command', label: t('command') },
      { key: 'state', label: t('status'), width: '110px' },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (job) => ({
      key: job.key,
      tone: job.active ? undefined : 'muted',
      cells: {
        schedule: [code(job.schedule)],
        command: [code(job.command), ...(job.description ? [ui.muted(job.description)] : [])],
        state: [onOff(scope.ctx, job.active)],
        actions: [{
          type: 'actions',
          items: scope.manage && scope.owner
            ? [{ type: 'button', label: t('delete'), icon: 'trash', variant: 'danger', action: { method: 'DELETE', url: `${scope.api}/cron${scope.ownerQuery}`, body: { key: job.key }, confirm: t('deleteCronConfirm') } }]
            : [],
        }],
      },
    }),
    empty: scope.fixed ? t('noCronYet') : t('empty'),
  });
  return [panel(`${t('tab.cron')} · ${jobs.length}`, [grid], { flush: true, actions, subtitle: scope.owner ? undefined : t('cronOwnerHint') })];
};
