<script lang="ts">
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';
  import Topbar from './Topbar.svelte';

  let { children }: { children: Snippet } = $props();

  const path = $derived($page.url.pathname);
  const isAuth = $derived(path === '/login' || path === '/register');
  const isRegister = $derived(path === '/register');
  const isCabinet = $derived(path === '/app' || path.startsWith('/app/'));
  const hideChrome = $derived(isAuth || isCabinet);
</script>

<div
  class="ui-shell"
  class:is-auth={isAuth}
  class:is-register={isRegister}
  class:is-cabinet={isCabinet}
>
  {#if !hideChrome}
    <Topbar />
  {/if}
  <main class="ui-shell__page">{@render children()}</main>
</div>

<style>
  .ui-shell {
    width: var(--ui-shell);
    margin: 0 auto;
    padding: 24px 0 64px;
  }

  .ui-shell.is-auth {
    width: min(1120px, calc(100% - 32px));
    min-height: 100vh;
    padding: 28px 16px;
    display: grid;
    align-content: center;
  }

  .ui-shell.is-register {
    width: min(820px, calc(100% - 32px));
  }

  .ui-shell.is-cabinet {
    width: 100%;
    max-width: none;
    min-height: 100vh;
    padding: 0;
  }

  .ui-shell.is-cabinet .ui-shell__page {
    gap: 0;
  }

  .ui-shell__page {
    display: grid;
    gap: var(--ui-gap-lg);
  }
</style>
