/**
 * ISPmanager 6 Host (addon): сервери й акаунти в адмінці, хостинг у кабінеті.
 * Діє, лише поки API-плагін `ispmanager` увімкнено в /admin/plugins.
 */
import type { WebPlugin } from '$lib/constructor/types';
import { loadCabinet } from '$lib/plugins/cabinet/store';
import AccountsBlock from './AccountsBlock.svelte';
import HostingBlock from './HostingBlock.svelte';
import { messages } from './messages.js';
import ServersBlock from './ServersBlock.svelte';

const GROUP = 'ispmanager:nav.group';

export const plugin: WebPlugin = {
  name: 'ispmanager',
  messages,
  blocks: {
    'ispmanager.accounts': AccountsBlock,
    'ispmanager.servers': ServersBlock,
    'ispmanager.hosting': HostingBlock,
  },
  nav: [
    { section: 'admin', href: '/admin/hosting', label: 'ispmanager:nav.accounts', icon: 'server', group: GROUP, permission: ['ispmanager', 'view'] },
    { section: 'admin', href: '/admin/hosting/servers', label: 'ispmanager:nav.servers', icon: 'settings', group: GROUP, permission: ['ispmanager', 'view'] },
    { section: 'cabinet', href: '/app/hosting', label: 'ispmanager:nav.hosting', icon: 'server' },
  ],
  pages: [
    {
      id: 'ispmanager-accounts',
      path: '/admin/hosting',
      section: 'admin',
      access: 'user',
      permission: ['ispmanager', 'view'],
      template: 'admin',
      title: 'ispmanager:nav.accounts',
      subtitle: 'ispmanager:accounts.subtitle',
      slots: { default: [{ block: 'ispmanager.accounts' }] },
    },
    {
      id: 'ispmanager-servers',
      path: '/admin/hosting/servers',
      section: 'admin',
      access: 'user',
      permission: ['ispmanager', 'view'],
      template: 'admin',
      title: 'ispmanager:nav.servers',
      subtitle: 'ispmanager:servers.subtitle',
      slots: { default: [{ block: 'ispmanager.servers' }] },
    },
    {
      id: 'ispmanager-hosting',
      path: '/app/hosting',
      section: 'cabinet',
      access: 'user',
      template: 'cabinet',
      title: 'ispmanager:cabinet.title',
      load: loadCabinet,
      slots: { default: [{ block: 'ispmanager.hosting' }] },
    },
  ],
};
