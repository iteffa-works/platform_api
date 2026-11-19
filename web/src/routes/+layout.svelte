<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import '$lib/ui/styles/index.css';
  import { APP_NAME, APP_ORIGIN } from '$lib/config';
  import { registerAllAuthExtensions, restoreSession, watchSession } from '$lib/domain/auth';
  import { provideI18n, type Locale } from '$lib/i18n';
  import AskHost from '$lib/ui/dialog/AskHost.svelte';
  import type { Snippet } from 'svelte';

  let { data, children }: { data: { locale: Locale }; children: Snippet } = $props();

  // svelte-ignore state_referenced_locally — мова з SSR потрібна лише на старті; далі її змінює setLocale
  provideI18n(data.locale);
  registerAllAuthExtensions();

  // Публічні сторінки: тихо підхопити сесію (кнопки «Кабінет» замість «Увійти»)
  onMount(() => {
    void restoreSession();
    // Вхід / вихід в інших вкладках і повернення у вкладку — одразу тут
    watchSession();
  });
</script>

<svelte:head>
  <title>{APP_NAME}</title>
  <link rel="canonical" href="{APP_ORIGIN}{$page.url.pathname}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="theme-color" content="#0b0d12" media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content="#eceef2" media="(prefers-color-scheme: light)" />
</svelte:head>

{@render children()}

<!-- Вікна підтвердження / введення (askConfirm, askPrompt) -->
<AskHost />
