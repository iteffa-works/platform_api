/** Планувальник (cron): розклад, команда, створення / видалення */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import { code, dialogButton, menu, onOff, panel, removeAction, table } from '../kit.js';
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

  return [
    ...(await scope.ownerFilter()),
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
          state: [onOff(scope.ctx, job.active)],
          // Службові завдання адміністратора панелі (без власника) не видаляються
          actions: scope.manage && scope.owner ? [menu([
            removeAction(t('delete'), `${scope.api}/cron${scope.ownerQuery}`, t('deleteCronConfirm'), { key: job.key }),
          ])] : [],
        },
      })),
      scope.fixed ? t('noCronYet') : t('empty'),
      t('search'),
    )], { flush: true, actions, subtitle: scope.owner ? undefined : t('cronOwnerHint') }),
  ];
};
