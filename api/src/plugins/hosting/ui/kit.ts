/** Конструктори вузлів сторінок хостингу: панелі, модальні форми, дії, вкладки консолі; таблиці — grid.ts */
import { ui, type Inline, type Tone, type UiAction, type UiButton, type UiContext, type UiField, type UiNode } from '../../../core/ui/index.js';
import type { ServerView } from '../services/presenter.js';

export const ADMIN = '/admin/hosting';
export const enc = encodeURIComponent;

export type Column = { key: string; label: string; align?: 'left' | 'right' | 'center'; width?: string; sortable?: boolean };
export function panel(title: string, children: UiNode[], options: { subtitle?: string; actions?: UiNode[]; flush?: boolean } = {}): UiNode {
  return { type: 'panel', title, children, subtitle: options.subtitle, actions: options.actions, flush: options.flush };
}

export function action(label: string, act: UiAction, variant: UiButton['variant'] = 'ghost'): UiButton {
  return { type: 'button', variant, label, action: act };
}

export function removeAction(label: string, url: string, confirm: string, body?: Record<string, unknown>): UiButton {
  return { type: 'button', variant: 'danger', label, action: { method: 'DELETE', url, confirm, body } };
}

/** Кнопка, що відкриває модальне вікно з формою */
export function dialogButton(label: string, title: string, nodes: UiNode[], icon = 'plus', variant: UiButton['variant'] = 'primary'): UiButton {
  return { type: 'button', label, icon, variant, dialog: { title, nodes } };
}

/** Показ пароля один раз (згенерований панеллю / платформою) */
export function secretResult(ctx: UiContext, key = 'password', title?: string) {
  return { key, format: 'secret' as const, title: title ?? ctx.t('generatedSecret'), text: ctx.t('passwordOnce') };
}

export function errorBanner(ctx: UiContext, error: unknown): UiNode {
  return { type: 'banner', tone: 'orange', text: ctx.t('panelError', { error: error instanceof Error ? error.message : String(error) }) };
}

export function badge(text: string, tone: Tone = 'slate'): UiNode {
  return ui.badge(text, tone);
}

export function onOff(ctx: UiContext, on: boolean, labels: [string, string] = [ctx.t('on'), ctx.t('off')]): UiNode {
  return badge(on ? labels[0] : labels[1], on ? 'green' : 'slate');
}

export function code(text: string): UiNode {
  return { type: 'code', text };
}

export function muted(text: Inline): UiNode {
  return ui.muted(text);
}

/** Поле пароля: порожньо — згенерувати */
export function passwordField(ctx: UiContext, name = 'password'): UiField {
  return { name, kind: 'password', label: ctx.t('passwordGenerate'), autocomplete: 'new-password', hint: ctx.t('passwordGenerateHint') };
}

/* ---------- Сервер ---------- */

/** Форма сервера (підключення / редагування) — одна для списку серверів і налаштувань консолі */
export function serverForm(ctx: UiContext, providers: Array<{ id: string; title: string; urlHint: string }>, editing?: ServerView, redirect?: string): UiNode {
  return {
    type: 'form',
    fields: [
      { name: 'provider', kind: 'select', label: ctx.t('provider'), value: editing?.provider ?? providers[0]?.id ?? 'ispmanager6', options: providers.map((item) => ({ value: item.id, label: item.title })) },
      { name: 'name', kind: 'text', label: ctx.t('serverName'), required: true, value: editing?.name ?? '' },
      { name: 'url', kind: 'text', label: ctx.t('url'), required: true, grow: true, value: editing?.url ?? '', placeholder: providers.map((item) => item.urlHint).join(' · '), autocomplete: 'off' },
      { name: 'username', kind: 'text', label: ctx.t('adminLogin'), required: true, value: editing?.username ?? '', autocomplete: 'off' },
      { name: 'password', kind: 'password', label: editing ? ctx.t('passwordKeep') : ctx.t('adminPassword'), required: !editing, autocomplete: 'new-password' },
      { name: 'location', kind: 'text', label: ctx.t('country'), value: editing?.location ?? '' },
      { name: 'ipv4', kind: 'text', label: 'IPv4', grow: true, value: editing?.ipv4 ?? '' },
      { name: 'ipv6', kind: 'text', label: 'IPv6', grow: true, value: editing?.ipv6 ?? '' },
      { name: 'maxAccounts', kind: 'number', label: ctx.t('maxAccounts'), value: editing?.maxAccounts ? String(editing.maxAccounts) : '' },
      { name: 'defaultPreset', kind: 'text', label: ctx.t('defaultPackage'), value: editing?.defaultPreset ?? '' },
      { name: 'verifyTls', kind: 'checkbox', label: ctx.t('verifyTls'), value: editing?.verifyTls ?? true },
      { name: 'isPublic', kind: 'checkbox', label: ctx.t('public'), value: editing?.isPublic ?? true },
    ],
    footer: [ui.muted(ctx.t('serverSecurityHint'))],
    submit: {
      label: editing ? ctx.t('save') : ctx.t('connect'),
      action: editing
        ? { method: 'PATCH', url: `${ADMIN}/servers/${editing.id}`, success: { notice: ctx.t('saved'), redirect } }
        : { method: 'POST', url: `${ADMIN}/servers`, success: { notice: ctx.t('serverConnected'), redirect: `${ADMIN}/servers/{server.id}` } },
    },
  };
}

export const CONSOLE_TABS = ['overview', 'users', 'sites', 'dns', 'mail', 'databases', 'ftp', 'ssl', 'cron', 'settings'] as const;
export type ConsoleTab = (typeof CONSOLE_TABS)[number];

/** Вкладки консолі сервера; owner зберігається між вкладками */
export function consoleTabs(ctx: UiContext, serverId: number, active: ConsoleTab, owner?: string): UiNode {
  const query = (tab: ConsoleTab) => {
    const params = new URLSearchParams();
    if (tab !== 'overview') params.set('tab', tab);
    if (owner && tab !== 'overview' && tab !== 'users' && tab !== 'settings') params.set('owner', owner);
    const search = params.toString();
    return `${ADMIN}/servers/${serverId}${search ? `?${search}` : ''}`;
  };
  return { type: 'tabs', items: CONSOLE_TABS.map((tab) => ({ label: ctx.t(`tab.${tab}`), href: query(tab), active: tab === active })) };
}

/** Відсоток використання для смуги; без ліміту — null */
export function usagePercent(used: number | null, limit: number | null): number | null {
  if (used === null || !limit) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function usageTone(percent: number | null): Tone {
  if (percent === null) return 'blue';
  return percent >= 90 ? 'red' : percent >= 70 ? 'orange' : 'green';
}
