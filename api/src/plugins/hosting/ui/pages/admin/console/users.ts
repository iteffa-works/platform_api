/** Користувачі панелі: квоти, привʼязка до платформи, вхід від імені, блокування, пароль, видалення */
import { ui, type UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { formatSize } from '../../../format.js';
import { action, ADMIN, badge, dialogButton, enc, menu, panel, removeAction, secretResult, table, usagePercent, usageTone } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const usersSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [{ accounts }, { packages }] = await Promise.all([
    hosting.servers.panelAccounts(console.server.id),
    hosting.servers.packages(console.server.id).catch(() => ({ packages: [] as string[] })),
  ]);

  const actions: UiNode[] = console.manage ? [dialogButton(t('newPanelUser'), t('newPanelUser'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      { name: 'login', kind: 'text', label: t('accountName'), required: true, autocomplete: 'off', hint: t('accountNameHint') },
      { name: 'name', kind: 'text', label: t('fullName') },
      { name: 'package', kind: 'select', label: t('package'), options: [{ value: '', label: t('noPackage') }, ...packages.map((name) => ({ value: name, label: name }))] },
      { name: 'password', kind: 'password', label: t('passwordGenerate'), autocomplete: 'new-password', hint: t('passwordGenerateHint') },
    ],
    footer: [ui.muted(t('panelUserHint'))],
    submit: { label: t('create'), action: { method: 'POST', url: `${console.api}/users`, success: { notice: t('created', { login: '{login}' }), result: secretResult(console.ctx) } } },
  }])] : [];

  return [panel(`${t('tab.users')} · ${accounts.length}`, [table(
    [
      { key: 'login', label: t('panelUser') },
      { key: 'package', label: t('package') },
      { key: 'disk', label: t('col.disk'), width: '180px' },
      { key: 'link', label: t('platform') },
      { key: 'status', label: t('status') },
      { key: 'actions', label: '', align: 'right', width: '48px' },
    ],
    accounts.map((user) => {
      const url = `${console.api}/users/${enc(user.login)}`;
      const percent = usagePercent(user.diskUsedMb, user.diskLimitMb);
      return {
        key: user.login,
        muted: user.suspended,
        cells: {
          login: [ui.text({ b: user.login }), ...(user.name ? [ui.muted(user.name)] : [])],
          package: [ui.text(user.package ?? '—', { size: 'sm' })],
          disk: [{ type: 'progress', value: percent, tone: usageTone(percent), label: `${formatSize(user.diskUsedMb)} / ${user.diskLimitMb ? formatSize(user.diskLimitMb) : '∞'}` }],
          link: user.accountId ? [{ type: 'link', text: t('linkedAccount'), href: `${ADMIN}/accounts` }] : [ui.muted('—')],
          status: [badge(user.suspended ? t('status.suspended') : t('status.active'), user.suspended ? 'orange' : 'green')],
          actions: console.manage ? [menu([
            action(t('loginAs'), { method: 'POST', url: `${url}/login`, openUrl: 'url', success: { reload: false } }),
            { type: 'button', variant: 'ghost', label: t('tab.sites'), href: `${console.page}?tab=sites&owner=${enc(user.login)}` },
            user.suspended
              ? action(t('resume'), { method: 'POST', url: `${url}/resume` })
              : action(t('suspend'), { method: 'POST', url: `${url}/suspend`, confirm: t('suspendConfirm', { login: user.login }) }),
            action(t('resetPassword'), { method: 'POST', url: `${url}/password`, confirm: t('resetPasswordConfirm', { login: user.login }), success: { result: secretResult(console.ctx), reload: false } }),
            !user.linked && removeAction(t('delete'), url, t('deletePanelUserConfirm', { login: user.login })),
          ])] : [],
        },
      };
    }),
    t('empty'),
    t('search'),
  )], { flush: true, actions, subtitle: t('usersHint') })];
};
