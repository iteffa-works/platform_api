/**
 * Головна кабінету (`/app`): привітання й внески плагінів через фільтр `ui.dashboard` (area: cabinet) —
 * повідомлення, показники, швидкі дії, панелі. Розширення не знає про хостинг чи білінг: що показати, вирішують плагіни.
 */
import { available, use } from '../../flowaxy/services/index.js';
import { collectDashboard, type UiMessages, type UiNode, type UiPage } from '../../flowaxy/ui/index.js';

export const messages: UiMessages = {
  uk: {
    'nav.overview': 'Огляд',
    'home.greeting': 'Вітаємо, {name}',
    'home.greetingAnon': 'Вітаємо в кабінеті',
    'home.lead': 'Ваші послуги, баланс і останні події — на одній сторінці.',
    'home.since': 'з нами з',
    'home.allGood': 'Усі системи працюють',
    'home.actions': 'Швидкі дії',
  },
  en: {
    'nav.overview': 'Overview',
    'home.greeting': 'Welcome, {name}',
    'home.greetingAnon': 'Welcome to your dashboard',
    'home.lead': 'Your services, balance and recent events on one page.',
    'home.since': 'member since',
    'home.allGood': 'All systems operational',
    'home.actions': 'Quick actions',
  },
  ru: {
    'nav.overview': 'Обзор',
    'home.greeting': 'Добро пожаловать, {name}',
    'home.greetingAnon': 'Добро пожаловать в кабинет',
    'home.lead': 'Ваши услуги, баланс и последние события — на одной странице.',
    'home.since': 'с нами с',
    'home.allGood': 'Все системы работают',
    'home.actions': 'Быстрые действия',
  },
};

export const cabinetHome: UiPage = {
  path: '/app',
  section: 'cabinet',
  title: 'nav.overview',
  async render(ctx) {
    const [me, dashboard] = await Promise.all([
      available('users') ? use('users').byIds([ctx.userId]).then((users) => users.get(ctx.userId)) : Promise.resolve(undefined),
      collectDashboard(ctx, 'cabinet'),
    ]);
    const name = me?.name?.trim() || me?.email?.split('@')[0];

    const nodes: UiNode[] = [
      {
        type: 'welcome',
        title: name ? ctx.t('home.greeting', { name }) : ctx.t('home.greetingAnon'),
        subtitle: me
          ? [me.email, ...(me.createdAt ? [` · ${ctx.t('home.since')} `, { type: 'date' as const, value: new Date(me.createdAt).toISOString() }] : [])]
          : ctx.t('home.lead'),
        avatar: me ? { seed: me.email, src: me.avatarUrl } : undefined,
        aside: { type: 'date', value: new Date().toISOString() },
        status: { tone: 'green', text: ctx.t('home.allGood') },
      },
      ...dashboard.alerts,
    ];
    if (dashboard.stats.length) nodes.push({ type: 'stats', items: dashboard.stats });
    if (dashboard.shortcuts.length) nodes.push({ type: 'shortcuts', items: dashboard.shortcuts });

    // Основна колонка — послуги й події; праворуч — зведення (рахунок, платежі, безпека)
    const main: UiNode = { type: 'stack', gap: 16, children: dashboard.panels };
    nodes.push(dashboard.aside.length
      ? { type: 'grid', layout: 'main-aside', children: [main, { type: 'stack', gap: 16, children: dashboard.aside }] }
      : main);
    return nodes;
  },
};
