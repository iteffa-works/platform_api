<script lang="ts">
  /** Плагіни: addon вмикаються / вимикаються без перезапуску, модулі ядра — лише список */
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { loadManifest } from '$lib/constructor/remote/manifest';
  import { can, user } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import { errorMessage } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Panel } from '$lib/ui/components';
  import { Badge, Button } from '$lib/ui/elements';
  import * as adminApi from './api.js';
  import type { PluginInfo } from './api.js';

  const { t, locale } = useI18n();

  let plugins = $state<PluginInfo[]>([]);
  let error = $state('');
  let busy = $state<string | null>(null);

  const canManage = $derived(can($user, 'plugins', 'manage'));
  const addons = $derived(plugins.filter((plugin) => plugin.kind === 'addon'));
  const core = $derived(plugins.filter((plugin) => plugin.kind === 'core'));

  async function load() {
    plugins = (await adminApi.fetchPlugins()).plugins;
  }

  async function toggle(plugin: PluginInfo) {
    if (plugin.enabled && !confirm($t('plugins.disableConfirm', { plugin: plugin.title }))) return;
    busy = plugin.name;
    error = '';
    try {
      const { plugin: updated } = await adminApi.setPluginEnabled(plugin.name, !plugin.enabled);
      plugins = plugins.map((item) => (item.name === updated.name ? updated : item));
      // Меню й сторінки addon оновлюються одразу
      await loadManifest(get(locale), $user?.id ?? null, true);
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = null;
    }
  }

  onMount(() => {
    load().catch((err) => (error = errorMessage(err)));
  });
</script>

<ErrorText message={error} />

<Panel title="{$t('plugins.addons')} · {addons.length}" flush>
  {#if addons.length === 0}
    <div class="empty"><EmptyState text={$t('plugins.empty')} /></div>
  {:else}
    <DataTable>
      {#snippet head()}
        <tr><th>{$t('plugins.plugin')}</th><th>{$t('plugins.status')}</th><th></th></tr>
      {/snippet}
      {#snippet body()}
        {#each addons as plugin (plugin.name)}
          <tr>
            <td>
              <strong>{plugin.title}</strong>
              <small class="muted">{plugin.name}{plugin.version ? ` · v${plugin.version}` : ''}</small>
              {#if plugin.description}<br /><small class="muted">{plugin.description}</small>{/if}
            </td>
            <td>
              <Badge tone={plugin.enabled ? 'green' : 'slate'}>
                {plugin.enabled ? $t('plugins.enabled') : $t('plugins.disabled')}
              </Badge>
            </td>
            <td class="actions">
              {#if canManage}
                <Button variant={plugin.enabled ? 'ghost' : 'primary'} disabled={busy !== null} onclick={() => toggle(plugin)}>
                  {plugin.enabled ? $t('plugins.disable') : $t('plugins.enable')}
                </Button>
              {/if}
            </td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  {/if}
</Panel>

<Panel title="{$t('plugins.coreModules')} · {core.length}" flush>
  <DataTable>
    {#snippet head()}
      <tr><th>{$t('plugins.plugin')}</th><th>{$t('plugins.kind')}</th></tr>
    {/snippet}
    {#snippet body()}
      {#each core as plugin (plugin.name)}
        <tr>
          <td><strong>{plugin.title}</strong> <small class="muted">{plugin.name}</small></td>
          <td><Badge tone="blue">{$t('plugins.core')}</Badge> <small class="muted">{$t('plugins.alwaysOn')}</small></td>
        </tr>
      {/each}
    {/snippet}
  </DataTable>
</Panel>

<style>
  .actions {
    text-align: right;
    white-space: nowrap;
  }

  .muted {
    color: var(--ui-muted);
  }

  .empty {
    padding: 16px;
  }
</style>
