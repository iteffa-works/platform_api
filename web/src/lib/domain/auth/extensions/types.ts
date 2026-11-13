import type { Component } from 'svelte';
import type { AuthMode } from '../config.js';

export type AuthExtensionField = {
  key: string;
  getValue: () => string | boolean | number | null | undefined;
};

export type AuthExtensionSlot = {
  id: string;
  component: Component<any>;
  props?: Record<string, unknown>;
  order?: number;
  modes?: AuthMode[];
};

export type AuthClientExtension = {
  name: string;
  enabled?: boolean;
  /** Якщо задано — fields/validate лише для цих режимів */
  modes?: AuthMode[];
  fields?: () => AuthExtensionField[];
  slots?: () => AuthExtensionSlot[];
  validate?: () => string | void;
  submitLabel?: (mode: AuthMode) => string | undefined;
  endpoint?: (mode: AuthMode) => string | undefined;
};
