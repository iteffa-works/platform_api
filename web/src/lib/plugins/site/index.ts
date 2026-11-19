/** Публічний сайт: головна хостингу (тарифи — з адмінки через `/public/hosting/plans`) */
import type { WebPlugin } from '$lib/constructor/types';
import CompareBlock from './CompareBlock.svelte';
import CtaBlock from './CtaBlock.svelte';
import FaqBlock from './FaqBlock.svelte';
import FeaturesBlock from './FeaturesBlock.svelte';
import HeroBlock from './HeroBlock.svelte';
import HomeActionsBlock from './HomeActionsBlock.svelte';
import PricingBlock from './PricingBlock.svelte';
import WorkflowBlock from './WorkflowBlock.svelte';

export const site: WebPlugin = {
  name: 'site',
  blocks: {
    'site.actions': HomeActionsBlock,
    'site.hero': HeroBlock,
    'site.pricing': PricingBlock,
    'site.features': FeaturesBlock,
    'site.compare': CompareBlock,
    'site.workflow': WorkflowBlock,
    'site.faq': FaqBlock,
    'site.cta': CtaBlock,
  },
  pages: [{
    id: 'home',
    path: '/',
    access: 'public',
    template: 'landing',
    slots: {
      actions: [{ block: 'site.actions' }],
      default: [
        { block: 'site.hero' },
        { block: 'site.pricing' },
        { block: 'site.features' },
        { block: 'site.compare' },
        { block: 'site.workflow' },
        { block: 'site.faq' },
        { block: 'site.cta' },
      ],
    },
  }],
};
