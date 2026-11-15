<script lang="ts">
  /**
   * Сторінка плагіна за схемою з API: POST /ui/page { path, state } → дерево вузлів.
   * state = query-параметри URL + значення живої форми. Після дії — перерендер / перехід;
   * результати (пароль один раз, діагностика) переживають перехід.
   */
  import { goto } from '$app/navigation';
  import { page as route } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { get, writable } from 'svelte/store';
  import { api } from '$lib/core/api';
  import { useI18n } from '$lib/i18n';
  import { errorMessage } from '$lib/shared/utils';
  import { ErrorText, Panel } from '$lib/ui/components';
  import { Button, Text } from '$lib/ui/elements';
  import { sectionLoad } from '../sections.js';
  import { callAction, interpolate, pendingResult, type ShownResult, type Values } from './actions.js';
  import { provideRemote } from './context.js';
  import type { UiAction, UiNode as Node } from './schema.js';
  import UiNode from './UiNode.svelte';

  let { section }: { section: string } = $props();

  const { locale } = useI18n();
  const busy = writable(false);
  const errorStore = writable('');
  const dialog = writable<string | null>(null);

  let nodes = $state<Node[] | null>(null);
  let version = $state(0);
  let error = $state('');
  $effect(() => errorStore.set(error));
  let notice = $state('');
  let result = $state<ShownResult | null>(null);
  let copied = $state(false);
  let live: Values = {};
  let request = 0;

  function queryState(): Values {
    return Object.fromEntries(get(route).url.searchParams.entries());
  }

  async function render() {
    const id = ++request;
    try {
      const data = await api<{ nodes: Node[] }>('/ui/page', {
        method: 'POST',
        body: { path: get(route).url.pathname, state: { ...queryState(), ...live } },
      });
      if (id !== request) return;
      nodes = data.nodes;
      version += 1;
      error = '';
    } catch (err) {
      if (id === request) error = errorMessage(err);
    }
  }

  async function run(action: UiAction, values: Values = {}) {
    busy.set(true);
    error = '';
    notice = '';
    try {
      const outcome = await callAction(action, values);
      if (!outcome) return;
      const response = outcome.response;
      const success = action.success ?? {};

      const failure = success.errorKey ? (response as Record<string, unknown> | null)?.[success.errorKey] : undefined;
      if (failure) error = String(failure);
      else if (success.notice) notice = interpolate(success.notice, response);

      if (success.result) {
        const value = (response as Record<string, unknown> | null)?.[success.result.key];
        if (value !== undefined && value !== null && value !== '') {
          pendingResult.set({
            title: interpolate(success.result.title, response),
            text: success.result.text ? interpolate(success.result.text, response) : undefined,
            format: success.result.format,
            value: success.result.format === 'json' ? JSON.stringify(value, null, 2) : String(value),
          });
        }
      }

      // Шапка розділу (баланс, сповіщення) могла змінитися
      void sectionLoad(section)?.();

      // Успіх — модальне вікно закривається (помилка лишає його відкритим із повідомленням)
      if (!failure) dialog.set(null);

      if (success.redirect) {
        live = {};
        const keep = notice;
        await goto(interpolate(success.redirect, response));
        notice = keep;
      } else if (success.reload !== false) {
        live = {};
        await render();
      }
      takeResult();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy.set(false);
    }
  }

  function refresh(values: Values) {
    live = values;
    void render();
  }

  function takeResult() {
    const pending = get(pendingResult);
    if (pending) {
      result = pending;
      copied = false;
      pendingResult.set(null);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.value);
    copied = true;
  }

  provideRemote({ run, refresh, busy, error: errorStore, dialog });

  // Новий шлях / query (вкладки, ?panel=…) → перерендер; інший шлях — старий результат прибрати
  let lastUrl = '';
  let lastPath = '';
  const stop = route.subscribe(($route) => {
    const url = `${$route.url.pathname}${$route.url.search}`;
    if (url === lastUrl) return;
    if ($route.url.pathname !== lastPath) {
      result = null;
      dialog.set(null);
    }
    lastUrl = url;
    lastPath = $route.url.pathname;
    live = {};
    takeResult();
    void render();
  });
  // Мова: тексти схеми перекладає сервер
  let lastLocale = get(locale);
  const stopLocale = locale.subscribe((value) => {
    if (value === lastLocale) return;
    lastLocale = value;
    void render();
  });
  onDestroy(() => {
    stop();
    stopLocale();
  });
</script>

<div class="remote">
  <ErrorText message={error} />
  {#if notice}<p class="notice">{notice}</p>{/if}

  {#if result}
    <Panel title={result.title}>
      {#if result.text}<Text tone="muted">{result.text}</Text>{/if}
      {#if result.format === 'secret'}
        <div class="secret">
          <code>{result.value}</code>
          <Button variant="ghost" onclick={copy}>{copied ? '✓' : '⧉'}</Button>
        </div>
      {:else}
        <pre class="json">{result.value}</pre>
      {/if}
      <Button variant="ghost" onclick={() => (result = null)}>×</Button>
    </Panel>
  {/if}

  {#if nodes}
    {#key version}
      {#each nodes as node, index (index)}<UiNode {node} />{/each}
    {/key}
  {/if}
</div>

<style>
  .remote {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .notice {
    margin: 0;
    color: var(--ui-success);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .secret {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
  }

  .secret code {
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--ui-surface-muted);
    font-size: 16px;
    overflow-wrap: anywhere;
  }

  .json {
    max-height: 420px;
    overflow: auto;
    padding: 12px;
    border-radius: 8px;
    background: var(--ui-surface-muted);
    font-size: 12px;
  }
</style>
