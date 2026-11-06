<script lang="ts">
  /** Auth shell: compact corporate split / register */
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';
  import AuthPromo from '$lib/blocks/auth/AuthPromo.svelte';
  import { AuthLayout } from '$lib/ui/layouts';

  let {
    title = '',
    children,
  }: {
    title?: string;
    children: Snippet;
  } = $props();

  const isRegister = $derived($page.url.pathname === '/register');
</script>

<AuthLayout>
  {#if isRegister}
    <div class="ui-auth ui-auth--dark ui-auth--register">
      <section class="ui-auth__panel">
        {#if title}<h1 class="ui-auth__title">{title}</h1>{/if}
        {@render children()}
      </section>
      <p class="ui-auth__copy">© 2024–2027 FLOWAXY DIGITAL STUDIO</p>
    </div>
  {:else}
    <div class="ui-auth ui-auth--dark ui-auth--login">
      <div class="ui-auth__shell">
        <AuthPromo />
        <section class="ui-auth__form-pane">
          {#if title}<h1 class="ui-auth__title">{title}</h1>{/if}
          {@render children()}
        </section>
      </div>
      <p class="ui-auth__copy">© 2024–2027 FLOWAXY DIGITAL STUDIO</p>
    </div>
  {/if}
</AuthLayout>

<style>
  .ui-auth--dark { width: 100%; }

  .ui-auth__shell {
    display: grid;
    grid-template-columns: 1.18fr 0.82fr;
    width: 100%;
    min-height: 640px;
    overflow: hidden;
    border: 1px solid #1c2230;
    border-radius: 4px;
    background: #090c12;
  }

  .ui-auth__form-pane {
    display: grid;
    align-content: start;
    padding: 32px 32px 28px;
    background: #080a0f;
    border-left: 1px solid #1c2230;
  }

  .ui-auth__panel {
    width: 100%;
    border: 1px solid #1c2230;
    border-radius: 4px;
    background: #090c12;
    padding: 28px 32px 32px;
  }

  .ui-auth__title {
    margin: 0 0 0.75rem;
    color: #f1f3f7;
    font-size: 1rem;
    font-weight: 600;
  }

  .ui-auth__copy {
    margin: 14px 0 0;
    text-align: center;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: #232833;
  }

  @media (max-width: 960px) {
    .ui-auth__shell {
      grid-template-columns: 1fr;
      min-height: 0;
    }
    .ui-auth__form-pane {
      border-left: 0;
      border-top: 1px solid #2a3140;
      align-content: start;
      padding: 24px 18px;
    }
    .ui-auth__panel { padding: 22px 16px 26px; }
  }
</style>
