/** Планувальник (cron): розклад, команда, створення / видалення */
import { ui, type UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { code, dialogButton, menu, onOff, ownerField, ownerFilter, panel, removeAction, table } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const cronSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [jobs, owners] = await Promise.all([hosting.panel.cron(console.server.id, console.owner), console.owners()]);

  const actions: UiNode[] = console.manage ? [dialogButton(t('newCron'), t('newCron'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      ownerField(console.ctx, owners, console.owner),
      { name: 'schedule', kind: 'text', label: t('schedule'), required: true, value: '*/15 * * * *', hint: t('scheduleHint') },
      { name: 'command', kind: 'text', label: t('command'), required: true, autocomplete: 'off' },
      { name: 'description', kind: 'text', label: t('description') },
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${console.api}/cron`, success: { notice: t('saved') } } },
  }])] : [];

  return [
    ownerFilter(console.ctx, owners, console.owner),
    panel(`${t('tab.cron')} · ${jobs.length}`, [table(
      [
        { key: 'schedule', label: t('schedule'), width: '140px' },
        { key: 'command', label: t('command') },
        { key: 'state', label: t('status'), width: '110px' },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      jobs.map((job) => ({
        key: job.key,
        muted: !job.active,
        cells: {
          schedule: [code(job.schedule)],
          command: [code(job.command), ...(job.description ? [ui.muted(job.description)] : [])],
          state: [onOff(console.ctx, job.active)],
          actions: console.manage && console.owner ? [menu([
            removeAction(t('delete'), `${console.api}/cron${console.ownerQuery}`, t('deleteCronConfirm'), { key: job.key }),
          ])] : [],
        },
      })),
      t('empty'),
      t('search'),
    )], { flush: true, actions, subtitle: console.owner ? undefined : t('cronOwnerHint') }),
  ];
};
