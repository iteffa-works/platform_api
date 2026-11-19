/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Error {
      message: string;
      /** Деталі для сторінки налагодження (лише в режимі DEBUG) */
      debug?: import('$lib/core/debug').DebugInfo;
    }

    interface Locals {
      locale: import('$lib/i18n').Locale;
      /** У запиті є cookie сесії (дійсність перевіряє API) */
      hasSession: boolean;
    }
  }
}

declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}

export {};
