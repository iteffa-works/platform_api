/** Типи конструктора сторінок */
import type { Component } from 'svelte';
import type { GrantLevel } from '$lib/shared/types';

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

export type BlockComponent = Component<any>;
