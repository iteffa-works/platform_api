/** Типи конструктора сторінок і web-плагінів */
import type { Component } from 'svelte';
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
  title?: string;
  subtitle?: string;
  slots?: PageSlots;
  /** Дані сторінки (виконується в load після перевірки доступу) */
  load?: () => Promise<unknown>;
};

/** Сторінка в реєстрі: знає свій плагін (для навігації) */
export type RegisteredPage = PageDefinition & { plugin: string };

export type BlockComponent = Component<any>;

/** Пункт навігації плагіна; ховається, якщо немає права */
export type NavItem = {
  href: string;
  label: string;
  permission?: PagePermission;
  icon?: IconName;
  /** Група в бічному меню (адмінка) */
  group?: string;
  /** Показувати також у верхній смузі */
  pinned?: boolean;
};

/**
 * Web-плагін: свої сторінки, блоки й навігація.
 * Підключається одним рядком у `$lib/plugins`.
 */
export type WebPlugin = {
  name: string;
  /** id блоку → компонент; id мають бути унікальні між плагінами */
  blocks?: Record<string, BlockComponent>;
  pages?: PageDefinition[];
  nav?: NavItem[];
};
