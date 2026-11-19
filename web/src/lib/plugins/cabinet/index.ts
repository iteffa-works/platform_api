/** Кабінет користувача: огляд, акаунт, безпека, тариф, реферали, журнал, сповіщення */
import type { MessageKey } from '$lib/i18n';
import type { PageDefinition, WebPlugin } from '$lib/constructor/types';
import AccountBlock from './AccountBlock.svelte';
import ActivityBlock from './ActivityBlock.svelte';
import BalanceChip from './BalanceChip.svelte';
import BillingBlock from './BillingBlock.svelte';
import NotificationBell from './NotificationBell.svelte';
import NotificationsBlock from './NotificationsBlock.svelte';
import PreferencesBlock from './PreferencesBlock.svelte';
import ReferralsBlock from './ReferralsBlock.svelte';
import SecurityBlock from './SecurityBlock.svelte';
import { loadCabinet } from './store.js';

/** Сторінка кабінету: шаблон, доступ і дані (профіль + шапка) спільні */
function page(id: string, path: string, title: MessageKey, block: string): PageDefinition {
  return {
    id,
    path,
    access: 'user',
    template: 'cabinet',
    title,
    load: loadCabinet,
    slots: { default: [{ block }] },
  };
}

const ACCOUNT = 'nav.group.account';

export const cabinet: WebPlugin = {
  name: 'cabinet',
  blocks: {
    'cabinet.account': AccountBlock,
    'cabinet.security': SecurityBlock,
    'cabinet.preferences': PreferencesBlock,
    'cabinet.billing': BillingBlock,
    'cabinet.referrals': ReferralsBlock,
    'cabinet.activity': ActivityBlock,
    'cabinet.notifications': NotificationsBlock,
    'cabinet.balance': BalanceChip,
    'cabinet.bell': NotificationBell,
  },
  header: [{ block: 'cabinet.balance' }, { block: 'cabinet.bell' }],
  sectionLoad: loadCabinet,
  nav: [
    { href: '/app', label: 'nav.overview', icon: 'dashboard' },
    // Група акаунта — другий ряд вкладок і меню акаунта
    { href: '/app/account', label: 'nav.account', icon: 'user', group: ACCOUNT },
    { href: '/app/security', label: 'nav.security', icon: 'lock', group: ACCOUNT },
    { href: '/app/preferences', label: 'nav.preferences', icon: 'sliders', group: ACCOUNT },
    { href: '/app/referrals', label: 'nav.referrals', icon: 'gift', group: ACCOUNT },
    { href: '/app/activity', label: 'nav.activity', icon: 'list', group: ACCOUNT },
  ],
  pages: [
    // Головна — серверна сторінка: внески плагінів (хостинг, баланс, безпека, журнал) через ui.dashboard
    {
      id: 'cabinet',
      path: '/app',
      access: 'user',
      template: 'cabinet',
      title: 'nav.overview',
      load: loadCabinet,
      slots: { default: [{ block: 'remote.page', props: { section: 'cabinet' } }] },
    },
    page('cabinet-account', '/app/account', 'nav.account', 'cabinet.account'),
    page('cabinet-security', '/app/security', 'nav.security', 'cabinet.security'),
    page('cabinet-preferences', '/app/preferences', 'nav.preferences', 'cabinet.preferences'),
    page('cabinet-billing', '/app/billing', 'nav.billing', 'cabinet.billing'),
    page('cabinet-referrals', '/app/referrals', 'nav.referrals', 'cabinet.referrals'),
    page('cabinet-activity', '/app/activity', 'nav.activity', 'cabinet.activity'),
    page('cabinet-notifications', '/app/notifications', 'notifications.title', 'cabinet.notifications'),
  ],
};
