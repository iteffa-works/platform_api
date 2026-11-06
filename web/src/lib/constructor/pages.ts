/** Каталог сторінок — збірка екранів масивом */
import type { PageDefinition } from './types.js';

export const pages: PageDefinition[] = [
  {
    id: 'home',
    path: '/',
    access: 'public',
    template: 'landing',
    title: 'Платформа',
    lead: 'Кабінет і адмінка працюють через platform API `/api/v1`.',
    slots: {
      meta: [{ block: 'site.origin' }],
      actions: [{ block: 'site.home-actions' }],
    },
  },
  {
    id: 'login',
    path: '/login',
    access: 'public',
    template: 'auth',
    slots: {
      default: [{
        block: 'auth.form',
        props: { mode: 'login' },
      }],
    },
  },
  {
    id: 'register',
    path: '/register',
    access: 'public',
    template: 'auth',
    slots: {
      default: [{ block: 'auth.register' }],
    },
  },
  {
    id: 'cabinet',
    path: '/app',
    access: 'user',
    template: 'cabinet',
    title: 'Dashboard',
    slots: {
      actions: [{ block: 'cabinet.admin-link' }],
      default: [{ block: 'cabinet.dashboard' }],
    },
  },
  {
    id: 'admin',
    path: '/admin',
    access: 'admin',
    template: 'admin',
    title: 'Адмінка',
    subtitle: 'Керування користувачами платформи',
    slots: {
      actions: [{ block: 'admin.cabinet-link' }],
      default: [{ block: 'admin.users' }],
    },
  },
];

/** Знайти сторінку за шляхом */
export function findPage(path: string): PageDefinition | undefined {
  const normalized = path !== '/' ? path.replace(/\/$/, '') : '/';
  return pages.find((page) => page.path === normalized);
}
