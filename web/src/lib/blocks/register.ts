/** Реєстрація всіх блоків конструктора */
import { registerBlock } from '$lib/constructor/registry.js';
import { UsersPanelBlock } from '$lib/blocks/admin';
import { AuthFormBlock } from '$lib/blocks/auth';
import { CabinetDashboardBlock } from '$lib/blocks/cabinet';
import {
  AdminLinkBlock,
  CtaBlock,
  FeaturesBlock,
  HeroBlock,
  HomeActionsBlock,
  WorkflowBlock,
} from '$lib/blocks/site';

let ready = false;

export function registerAllBlocks(): void {
  if (ready) return;
  registerBlock('auth.form', AuthFormBlock);
  registerBlock('cabinet.dashboard', CabinetDashboardBlock);
  registerBlock('cabinet.admin-link', AdminLinkBlock);
  registerBlock('admin.users', UsersPanelBlock);
  registerBlock('site.actions', HomeActionsBlock);
  registerBlock('site.hero', HeroBlock);
  registerBlock('site.features', FeaturesBlock);
  registerBlock('site.workflow', WorkflowBlock);
  registerBlock('site.cta', CtaBlock);
  ready = true;
}
