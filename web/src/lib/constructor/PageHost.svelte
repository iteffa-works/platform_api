<script lang="ts">
  /** Хост: шаблон + слоти з масиву сторінки */
  import { adminError } from '$lib/domain/admin';
  import { user } from '$lib/domain/auth';
  import { AdminTemplate, AuthTemplate, CabinetTemplate, LandingTemplate } from '$lib/ui/templates';
  import BlockSlot from './BlockSlot.svelte';
  import type { PageDefinition } from './types.js';

  let { page }: { page: PageDefinition } = $props();

  const slots = $derived(page.slots ?? {});
  const cabinetSubtitle = $derived(
    `${$user?.email || ''} · ${$user?.role === 'admin' ? 'адміністратор' : 'користувач'}`,
  );
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
  <CabinetTemplate title={page.title || ''} subtitle={cabinetSubtitle}>
    {#snippet actions()}
      <BlockSlot items={slots.actions} />
    {/snippet}
    <BlockSlot items={slots.default} />
  </CabinetTemplate>
{:else if page.template === 'admin'}
  <AdminTemplate title={page.title || ''} subtitle={page.subtitle || ''} error={$adminError}>
    <BlockSlot items={slots.default} />
  </AdminTemplate>
{/if}
