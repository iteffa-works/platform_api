/** Публічний сайт: лендинг */
import type { WebPlugin } from '$lib/constructor/types';
import CtaBlock from './CtaBlock.svelte';
import FeaturesBlock from './FeaturesBlock.svelte';
import HeroBlock from './HeroBlock.svelte';
import HomeActionsBlock from './HomeActionsBlock.svelte';
import WorkflowBlock from './WorkflowBlock.svelte';

export const site: WebPlugin = {
  name: 'site',
  blocks: {
    'site.actions': HomeActionsBlock,
    'site.hero': HeroBlock,
    'site.features': FeaturesBlock,
    'site.workflow': WorkflowBlock,
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
        { block: 'site.features' },
        { block: 'site.workflow' },
        { block: 'site.cta' },
      ],
    },
  }],
};
