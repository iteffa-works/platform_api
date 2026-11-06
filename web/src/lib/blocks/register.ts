/** Реєстрація всіх блоків конструктора */
import { registerBlock } from '$lib/constructor/registry.js';
import AccountsPanelBlock from './accounts/AccountsPanelBlock.svelte';
import UsersPanelBlock from './admin/UsersPanelBlock.svelte';
import AuthFormBlock from './auth/AuthFormBlock.svelte';
import AdminLinkBlock from './site/AdminLinkBlock.svelte';
import CabinetLinkBlock from './site/CabinetLinkBlock.svelte';
import HomeActionsBlock from './site/HomeActionsBlock.svelte';
import OriginBlock from './site/OriginBlock.svelte';

let ready = false;

export function registerAllBlocks(): void {
  if (ready) return;
  registerBlock('auth.form', AuthFormBlock);
  registerBlock('accounts.panel', AccountsPanelBlock);
  registerBlock('admin.users', UsersPanelBlock);
  registerBlock('site.origin', OriginBlock);
  registerBlock('site.home-actions', HomeActionsBlock);
  registerBlock('cabinet.admin-link', AdminLinkBlock);
  registerBlock('admin.cabinet-link', CabinetLinkBlock);
  ready = true;
}
