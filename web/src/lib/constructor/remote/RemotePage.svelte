<script lang="ts" module>
  import type { UiButton as CachedButton, UiNode as CachedNode } from './schema.js';

  /**
   * Кеш відрендерених сторінок (stale-while-revalidate): повернення на вкладку / сторінку показує
   * останній вміст одразу, а свіжий приходить слідом. Будь-яка дія очищає кеш — після змін
   * старі дані не показуються. Ключ — користувач, мова, шлях і query.
   */
  type Entry = { nodes: CachedNode[]; actions: CachedButton[]; json: string };
  const CACHE_LIMIT = 40;
  const cache = new Map<string, Entry>();

  function remember(key: string, entry: Entry) {
    cache.delete(key);
    cache.set(key, entry);
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  }
</script>

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
  import { user } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import { errorMessage } from '$lib/shared/utils';
  import { headerSlot, portal } from '$lib/ui/admin';
  import { ErrorText, Panel } from '$lib/ui/components';
  import { Button, Text } from '$lib/ui/elements';
  import { sectionLoad } from '../sections.js';
  import { callAction, interpolate, pendingResult, type ShownResult, type Values } from './actions.js';
  import { provideRemote } from './context.js';
  import { loadManifest } from './manifest.js';
  import type { UiAction, UiButton, UiNode as Node, UiRendered } from './schema.js';
  import UiButtonNode from './UiButtonNode.svelte';
  import UiNode from './UiNode.svelte';

  let { section }: { section: string } = $props();

  const { locale } = useI18n();
  const busy = writable(false);
  const errorStore = writable('');
  const dialog = writable<string | null>(null);

  let nodes = $state<Node[] | null>(null);
  /** Кнопки в шапці сторінки (шаблон надає слот; без слота — над вмістом) */
  let actions = $state<UiButton[]>([]);
  let version = $state(0);
  let error = $state('');
  $effect(() => errorStore.set(error));
  let notice = $state('');
  let result = $state<ShownResult | null>(null);
  let copied = $state(false);
  let live: Values = {};
  let request = 0;
  /** Запит у дорозі (індикатор зʼявляється з затримкою — швидкі відповіді без мерехтіння) */
  let loading = $state(false);
  /** Показано вміст іншої сторінки, ніж запитана (перехід без кешу) — приглушити */
  let stale = $state(false);
  let shownJson = '';
  let shownKey = '';

  function queryState(): Values {
    return Object.fromEntries(get(route).url.searchParams.entries());
  }

  /** Показати відповідь; та сама, що на екрані, — без перемонтування (фокус, прокрутка, стан форм лишаються) */
  function apply(entry: Entry, key: string) {
    shownKey = key;
    if (entry.json === shownJson) return;
    shownJson = entry.json;
    nodes = entry.nodes;
    actions = entry.actions;
    version += 1;
  }

  async function render() {
    const id = ++request;
    const path = get(route).url.pathname;
    const query = queryState();
    const key = `${get(user)?.id ?? ''}|${get(locale)}|${path}|${get(route).url.search}`;
    // Жива форма (підсумок замовлення) — не кешується: значення ще не збережені
    const cacheable = !Object.keys(live).length;
    const cached = cacheable ? cache.get(key) : undefined;
    if (cached) apply(cached, key);
    stale = !cached && cacheable && key !== shownKey;
    loading = true;
    try {
      const data = await api<UiRendered>('/ui/page', { method: 'POST', body: { path, state: { ...query, ...live } } });
      if (id !== request) return;
      const entry: Entry = { nodes: data.nodes, actions: data.actions ?? [], json: JSON.stringify(data) };
      if (cacheable) remember(key, entry);
      apply(entry, key);
      error = '';
    } catch (err) {
      if (id === request) error = errorMessage(err);
    } finally {
      if (id === request) {
        loading = false;
        stale = false;
      }
    }
  }

  async function run(action: UiAction, values: Values = {}) {
    busy.set(true);
    error = '';
    notice = '';
    try {
      const outcome = await callAction(action, values);
      if (!outcome) return;
      // Дані змінилися — кешовані сторінки застаріли
      cache.clear();
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
      // Вмикання / вимикання плагіна: меню й сторінки addon — одразу
      if (success.manifest) await loadManifest(get(locale), get(user)?.id ?? null, true);

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

<div class="remote" aria-busy={loading} class:is-stale={stale}>
  {#if loading}<div class="loadbar" aria-hidden="true"></div>{/if}
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

  {#if actions.length}
    <div class="page-actions" use:portal={$headerSlot}>
      {#each actions as action, index (index)}<UiButtonNode node={action} />{/each}
    </div>
  {/if}

  {#if nodes}
    <div class="remote__body">
      {#key version}
        {#each nodes as node, index (index)}<UiNode {node} />{/each}
      {/key}
    </div>
  {:else if !error}
    <div class="skeleton" aria-hidden="true">
      <span style:height="56px"></span>
      <span style:height="92px"></span>
      <span style:height="260px"></span>
    </div>
  {/if}
</div>

<style>
  .page-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .remote {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .remote__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    transition: opacity 0.15s;
  }

  /* Перехід на сторінку без кешу: старий вміст приглушено, якщо відповідь затримується */
  .remote.is-stale .remote__body {
    opacity: 0.55;
    pointer-events: none;
    transition-delay: 0.15s;
  }

  .loadbar {
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    overflow: hidden;
    opacity: 0;
    animation: loadbar-in 0s 0.15s forwards;
  }

  .loadbar::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 40%;
    background: var(--ui-accent);
    animation: loadbar-run 1s ease-in-out infinite;
  }

  @keyframes loadbar-in {
    to { opacity: 1; }
  }

  @keyframes loadbar-run {
    from { transform: translateX(-100%); }
    to { transform: translateX(250%); }
  }

  .skeleton {
    display: grid;
    gap: 16px;
  }

  .skeleton span {
    border-radius: var(--ui-radius-lg, 12px);
    background: linear-gradient(90deg, var(--ui-surface-muted) 25%, var(--ui-surface) 50%, var(--ui-surface-muted) 75%);
    background-size: 200% 100%;
    animation: skeleton 1.2s linear infinite;
  }

  @keyframes skeleton {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .loadbar::before,
    .skeleton span {
      animation: none;
    }
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
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface-muted);
    font-size: 16px;
    overflow-wrap: anywhere;
  }

  .json {
    max-height: 420px;
    overflow: auto;
    padding: 12px;
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface-muted);
    font-size: 12px;
  }
</style>
