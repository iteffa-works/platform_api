/** Внесок білінгу в головну кабінету: картка «Рахунок» праворуч — баланс, заявки, що чекають, поповнення */
import { config } from '../../../config/index.js';
import { hooks } from '../../../flowaxy/hooks/index.js';
import { isEnabled } from '../../../flowaxy/plugins/index.js';
import { withMessages, type DashboardSection } from '../../../flowaxy/ui/index.js';
import { summary } from '../service.js';
import { messages } from './messages.js';

export function registerBillingDashboard(): void {
  hooks.addFilter('ui.dashboard', async (sections, { ctx: base, area }): Promise<DashboardSection[]> => {
    if (area !== 'cabinet') return sections;
    const ctx = withMessages(base, messages);
    const balance = await summary(ctx.userId);
    return [...sections, {
      order: 5,
      aside: [{
        type: 'panel',
        title: ctx.t('dash.account'),
        actions: [{ type: 'button', variant: 'link', label: ctx.t('dash.history'), href: '/app/billing' }],
        children: [
          {
            type: 'stack',
            gap: 2,
            children: [
              { type: 'text', text: ctx.t('dash.balance'), tone: 'muted', size: 'sm' },
              { type: 'text', text: { type: 'money', amount: balance.balance, currency: config.currency }, size: 'xl', bold: true },
              { type: 'text', text: balance.pendingTopups ? ctx.t('dash.pending', { count: balance.pendingTopups }) : ctx.t('dash.balanceHint'), tone: balance.pendingTopups ? 'warn' : 'muted', size: 'sm' },
            ],
          },
          { type: 'button', icon: 'wallet', label: ctx.t('dash.topup'), href: '/app/billing' },
        ],
      }],
    }];
  }, { owner: 'billing', when: () => isEnabled('billing') });
}
