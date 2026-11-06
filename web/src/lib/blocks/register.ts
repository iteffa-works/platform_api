/** Реєстрація всіх блоків конструктора */
import { registerBlock } from '$lib/constructor/registry.js';
import { AccountsPanelBlock } from '$lib/blocks/accounts';
import { UsersPanelBlock } from '$lib/blocks/admin';
import { AuthFormBlock, RegisterFormBlock } from '$lib/blocks/auth';
import { CabinetDashboardBlock } from '$lib/blocks/cabinet';
import {
  AdminLinkBlock,
  CabinetLinkBlock,
  HomeActionsBlock,
  OriginBlock,
} from '$lib/blocks/site';

let ready = false;

export function registerAllBlocks(): void {
  if (ready) return;
  registerBlock('auth.form', AuthFormBlock);
  registerBlock('auth.register', RegisterFormBlock);
  registerBlock('accounts.panel', AccountsPanelBlock);
  registerBlock('cabinet.dashboard', CabinetDashboardBlock);
  registerBlock('admin.users', UsersPanelBlock);
  registerBlock('site.origin', OriginBlock);
  registerBlock('site.home-actions', HomeActionsBlock);
  registerBlock('cabinet.admin-link', AdminLinkBlock);
  registerBlock('admin.cabinet-link', CabinetLinkBlock);
  ready = true;
}
