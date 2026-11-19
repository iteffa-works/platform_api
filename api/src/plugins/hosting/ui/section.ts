/**
 * Розділ «Хостинг» в адмінці: один пункт меню, вкладки зверху (Огляд · Акаунти · Сервери · Тарифи) з лічильниками.
 * Обгортка сторінки: заголовок «Хостинг» і вкладки перед вмістом; сторінки сервера й акаунта — з активною батьківською.
 */
import { Op } from 'sequelize';
import type { UiContext, UiNode, UiPage } from '../../../flowaxy/ui/index.js';
import { HostingAccount, HostingPlan, HostingServer } from '../domain/models.js';
import { ADMIN } from './kit.js';

export type SectionTab = 'overview' | 'accounts' | 'servers' | 'plans';

const TABS: Array<{ tab: SectionTab; href: string }> = [
  { tab: 'overview', href: ADMIN },
  { tab: 'accounts', href: `${ADMIN}/accounts` },
  { tab: 'servers', href: `${ADMIN}/servers` },
  { tab: 'plans', href: `${ADMIN}/plans` },
];

/** Вкладки розділу; лічильники — три COUNT */
export async function sectionTabs(ctx: UiContext, active: SectionTab): Promise<UiNode> {
  const [accounts, servers, plans] = await Promise.all([
    HostingAccount.count({ where: { status: { [Op.ne]: 'deleted' } } }),
    HostingServer.count(),
    HostingPlan.count(),
  ]);
  const counts: Partial<Record<SectionTab, number>> = { accounts, servers, plans };
  return {
    type: 'tabs',
    items: TABS.map(({ tab, href }) => ({ label: ctx.t(`section.${tab}`), href, active: tab === active, count: counts[tab] })),
  };
}

/** Сторінка адмінки хостингу як вкладка розділу */
export function inSection(page: UiPage, tab: SectionTab): UiPage {
  return {
    ...page,
    title: 'nav.hosting',
    async render(ctx) {
      const [tabs, rendered] = await Promise.all([sectionTabs(ctx, tab), page.render(ctx)]);
      return Array.isArray(rendered) ? [tabs, ...rendered] : { ...rendered, nodes: [tabs, ...rendered.nodes] };
    },
  };
}
