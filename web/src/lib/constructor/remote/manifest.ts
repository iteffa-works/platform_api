/**
 * Маніфест плагінів з API: маршрути сторінок, меню, сервіси й переклади ключів (мовою запиту).
 * Плагіни (addon) не мають коду в web — сторінки рендерить RemotePage за схемою з `/ui/page`.
 */
import { writable } from 'svelte/store';
import { api } from '$lib/core/api';
import { setRemoteMessages, type Locale } from '$lib/i18n';
import type { PagePermission } from '../types.js';
import type { Tone } from './schema.js';

export type RemotePageRef = {
  path: string;
  plugin: string;
  section: 'admin' | 'cabinet';
  /** Ключі `<плагін>:<ключ>` — тексти в `messages` */
  title: string;
  subtitle?: string;
  permission?: PagePermission;
};

export type RemoteNavItem = {
  plugin: string;
  section: string;
  href: string;
  label: string;
  icon?: string;
  group?: string;
  pinned?: boolean;
  permission?: PagePermission;
};

export type RemoteService = { plugin: string; href: string; label: string; icon: string; tone: Tone; permission?: PagePermission };

export type Manifest = {
  pages: RemotePageRef[];
  nav: RemoteNavItem[];
  services: RemoteService[];
  messages: Record<string, string>;
};

const EMPTY: Manifest = { pages: [], nav: [], services: [], messages: {} };

export const manifest = writable<Manifest>(EMPTY);

let pending: Promise<Manifest> | null = null;
let loadedFor: string | null = null;

/**
 * Завантажити маніфест: кеш на мову й користувача (вхід / вихід змінюють меню); `force` — після вмикання плагіна.
 * Мова тексту — Accept-Language api-клієнта.
 */
export function loadManifest(locale: Locale, userId: number | null, force = false): Promise<Manifest> {
  const key = `${locale}|${userId ?? 'guest'}`;
  if (!pending || force || loadedFor !== key) {
    loadedFor = key;
    pending = api<Manifest>('/ui/manifest')
      .then((data) => {
        setRemoteMessages(locale, data.messages);
        manifest.set(data);
        return data;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}

function compile(path: string): RegExp {
  const source = path.split('/').map((part) => (/^\[\w+\]$/.test(part) ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/');
  return new RegExp(`^${source}$`);
}

/** Сторінка плагіна за шляхом: точний збіг, далі шаблони з параметрами */
export function matchRemote(data: Manifest, path: string): RemotePageRef | undefined {
  const normalized = path !== '/' ? path.replace(/\/$/, '') : '/';
  return data.pages.find((page) => page.path === normalized)
    ?? data.pages.find((page) => page.path.includes('[') && compile(page.path).test(normalized));
}
