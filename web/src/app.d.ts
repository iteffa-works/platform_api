/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Locals {
      locale: import('$lib/i18n').Locale;
    }
  }
}

declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}

export {};
