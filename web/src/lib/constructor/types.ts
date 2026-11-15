/** Типи конструктора сторінок і web-плагінів */
import type { Component } from 'svelte';
import type { PluginMessages, TextKey } from '$lib/i18n';
import type { GrantLevel } from '$lib/shared/types';
import type { IconName } from '$lib/ui/elements';

export type AccessLevel = 'public' | 'user';

/** Потрібне право: [ресурс, рівень] */
export type PagePermission = [resource: string, level: GrantLevel];

export type TemplateId = 'landing' | 'auth' | 'cabinet' | 'admin';

export type BlockRef = {
  /** id зареєстрованого блоку */
  block: string;
  /** пропси, які отримає блок */
  props?: Record<string, unknown>;
};

export type PageSlots = {
  default?: BlockRef[];
  actions?: BlockRef[];
};

export type PageDefinition = {
  id: string;
  path: string;
  access: AccessLevel;
  permission?: PagePermission;
  template: TemplateId;
  /** Ключі перекладів заголовка й підзаголовка */
  title?: TextKey;
  subtitle?: TextKey;
  /** Розділ, чию навігацію й шапку показує сторінка (`admin`, `cabinet`); за замовчуванням — свій плагін */
  section?: string;
  slots?: PageSlots;
  /** Дані сторінки (виконується в load після перевірки доступу) */
  load?: () => Promise<unknown>;
};

/** Сторінка в реєстрі: знає свій плагін, розділ навігації й чи це addon */
export type RegisteredPage = PageDefinition & { plugin: string; section: string; addon: boolean };

export type BlockComponent = Component<any>;

/** Пункт навігації плагіна; ховається, якщо немає права */
export type NavItem = {
  href: string;
  /** Ключ перекладу */
  label: TextKey;
  permission?: PagePermission;
  icon?: IconName;
  /** Група (ключ перекладу): бічне меню адмінки; `nav.group.account` — вкладки акаунта в кабінеті */
  group?: TextKey;
  /** Показувати також у верхній смузі */
  pinned?: boolean;
  /** Навігація якого розділу (`admin`, `cabinet`); за замовчуванням — свій плагін */
  section?: string;
};

/** Пункт навігації в реєстрі: знає плагін-власника (ховається, якщо addon вимкнено) */
export type RegisteredNavItem = NavItem & { plugin: string };

/**
 * Web-плагін: свої сторінки, блоки й навігація.
 * Ядро — `$lib/plugins` (рядок у index.ts); addon — тека `src/plugins/<name>` з `export const plugin`,
 * підхоплюється автоматично й діє, лише поки однойменний API-плагін увімкнено в адмінці.
 */
export type WebPlugin = {
  name: string;
  /** id блоку → компонент; id мають бути унікальні між плагінами */
  blocks?: Record<string, BlockComponent>;
  pages?: PageDefinition[];
  nav?: NavItem[];
  /** Блоки в шапці шаблону сторінок плагіна (баланс, сповіщення) */
  header?: BlockRef[];
  /** Переклади addon: у коді — `$t('<плагін>:<ключ>')` */
  messages?: PluginMessages;
};
