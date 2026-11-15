/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
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
