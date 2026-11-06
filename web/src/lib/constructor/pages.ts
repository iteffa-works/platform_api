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
    title: 'Вхід',
    slots: {
      default: [{
        block: 'auth.form',
        props: {
          submitLabel: 'Увійти',
          endpoint: '/auth/login',
          altHref: '/register',
          altText: 'Немає акаунта',
        },
      }],
    },
  },
  {
    id: 'register',
    path: '/register',
    access: 'public',
    template: 'auth',
    title: 'Реєстрація',
    slots: {
      default: [{
        block: 'auth.form',
        props: {
          submitLabel: 'Створити акаунт',
          endpoint: '/auth/register',
          altHref: '/login',
          altText: 'Вже є акаунт',
        },
      }],
    },
  },
  {
    id: 'cabinet',
    path: '/app',
    access: 'user',
    template: 'cabinet',
    title: 'Кабінет',
    banner: 'Керуйте акаунтами. Важка обробка виконується клієнтами через /api/client/v1.',
    slots: {
      actions: [{ block: 'cabinet.admin-link' }],
      default: [{ block: 'accounts.panel' }],
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
