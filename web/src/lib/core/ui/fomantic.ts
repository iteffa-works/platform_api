import { browser } from '$app/environment';

let ready: Promise<void> | null = null;

// Підключення jQuery + Fomantic UI лише в браузері
export function initFomantic(): Promise<void> {
  if (!browser) return Promise.resolve();
  if (!ready) {
    ready = (async () => {
      const { default: $ } = await import('jquery');
      const win = window as Window & { jQuery?: JQueryStatic; $?: JQueryStatic };
      win.jQuery = win.$ = $;
      await import('fomantic-ui-css/semantic.min.js');
    })();
  }
  return ready;
}
