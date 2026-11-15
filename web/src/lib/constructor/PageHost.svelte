<script lang="ts">
  /** Хост: шаблон + слоти сторінки + навігація її плагіна */
  import { page as route } from '$app/stores';
  import { can, user } from '$lib/domain/auth';
  import { adminError } from '$lib/plugins/admin/store';
  import { AdminTemplate, AuthTemplate, CabinetTemplate, LandingTemplate } from '$lib/ui/templates';
  import BlockSlot from './BlockSlot.svelte';
  import { allowedNav, entryOf } from './nav.js';
  import { headerOf, navOf } from './registry.js';
  import type { RegisteredPage } from './types.js';

  let { page }: { page: RegisteredPage } = $props();

  const slots = $derived(page.slots ?? {});
  const current = $derived($route.url.pathname);
  const nav = $derived(allowedNav(navOf(page.plugin), $user));
  const adminHref = $derived(can($user, 'admin.panel', 'view') ? entryOf(navOf('admin'), $user) : null);
</script>

{#if page.template === 'landing'}
  <LandingTemplate>
    {#snippet actions()}
      <BlockSlot items={slots.actions} />
    {/snippet}
    <BlockSlot items={slots.default} />
  </LandingTemplate>
{:else if page.template === 'auth'}
  <AuthTemplate>
    <BlockSlot items={slots.default} />
  </AuthTemplate>
{:else if page.template === 'cabinet'}
  <CabinetTemplate title={page.title} {nav} {current} {adminHref}>
    {#snippet tools()}
      <BlockSlot items={headerOf(page.plugin)} />
    {/snippet}
    <BlockSlot items={slots.default} />
  </CabinetTemplate>
{:else if page.template === 'admin'}
  <AdminTemplate title={page.title} subtitle={page.subtitle} error={$adminError} {nav} {current}>
    <BlockSlot items={slots.default} />
  </AdminTemplate>
{/if}
