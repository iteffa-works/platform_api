/** Типи конструктора сторінок */
import type { Component } from 'svelte';

export type AccessLevel = 'public' | 'user' | 'admin';

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
  meta?: BlockRef[];
};

export type PageDefinition = {
  id: string;
  path: string;
  access: AccessLevel;
  template: TemplateId;
  title?: string;
  subtitle?: string;
  lead?: string;
  banner?: string;
  slots?: PageSlots;
};

export type BlockComponent = Component<any>;
