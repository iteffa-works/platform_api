<script lang="ts">
  /** Хост: шаблон + слоти сторінки + навігація розділу (ядро + плагіни з маніфесту API) */
  import { page as route } from '$app/stores';
  import { can, user } from '$lib/domain/auth';
  import { useI18n, type TextKey } from '$lib/i18n';
  import { adminError } from '$lib/plugins/admin/store';
  import type { IconName } from '$lib/ui/elements';
  import { AdminTemplate, AuthTemplate, CabinetTemplate, LandingTemplate } from '$lib/ui/templates';
  import BlockSlot from './BlockSlot.svelte';
  import { allowedNav, entryOf } from './nav.js';
  import { headerOf, navOf } from './registry.js';
  import { loadManifest, manifest } from './remote/manifest.js';
  import type { RegisteredPage } from './types.js';

  let { page }: { page: RegisteredPage } = $props();

  const { locale } = useI18n();

  // Маніфест мовою інтерфейсу й для поточного користувача (меню, сервіси, переклади плагінів)
  $effect(() => {
    if (page.access !== 'public') void loadManifest($locale, $user?.id ?? null).catch(() => undefined);
  });

  const slots = $derived(page.slots ?? {});
  const current = $derived($route.url.pathname);
  const nav = $derived(allowedNav(navOf(page.section, $manifest.nav), $user));
  const services = $derived(
    $manifest.services
      .filter((item) => !item.permission || can($user, ...item.permission))
      .map((item) => ({ href: item.href, label: item.label as TextKey, icon: item.icon as IconName, tone: item.tone })),
  );
  const adminHref = $derived(can($user, 'admin.panel', 'view') ? entryOf(navOf('admin', $manifest.nav), $user) : null);
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
  <CabinetTemplate title={page.title} {nav} {current} {adminHref} extraServices={services}>
    {#snippet tools()}
      <BlockSlot items={headerOf(page.section)} />
    {/snippet}
    <BlockSlot items={slots.default} />
  </CabinetTemplate>
{:else if page.template === 'admin'}
  <AdminTemplate title={page.title} subtitle={page.subtitle} error={$adminError} {nav} {current}>
    <BlockSlot items={slots.default} />
  </AdminTemplate>
{/if}
