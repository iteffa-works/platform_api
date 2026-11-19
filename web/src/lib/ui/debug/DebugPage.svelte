<script lang="ts">
  /**
   * Сторінка налагодження (режим DEBUG), як у Laravel: що за виняток, де стався, стек викликів
   * і код навколо рядка з помилкою. Кадри бібліотек згорнуті, кадри застосунку — першими.
   */
  import { debugText, editorLink, shortPath, type DebugFrame, type DebugInfo } from '$lib/core/debug';
  import { formatDateTime } from '$lib/shared/utils';

  let { info, status }: { info: DebugInfo; status: number } = $props();

  const ORIGIN = { api: 'API', web: 'Web · SSR', browser: 'Браузер' } as const;

  const firstApp = $derived(Math.max(0, info.frames.findIndex((frame) => frame.app && frame.snippet)));
  let selected = $state(-1);
  const current = $derived<DebugFrame | undefined>(info.frames[selected >= 0 ? selected : firstApp]);
  const activeIndex = $derived(selected >= 0 ? selected : firstApp);
  let showVendor = $state(false);
  let copied = $state(false);

  /** Групи підряд: кадри застосунку окремо, бібліотечні — згорнутими пачками */
  const groups = $derived.by(() => {
    const result: Array<{ app: boolean; items: Array<{ frame: DebugFrame; index: number }> }> = [];
    info.frames.forEach((frame, index) => {
      const last = result.at(-1);
      if (last && last.app === frame.app) last.items.push({ frame, index });
      else result.push({ app: frame.app, items: [{ frame, index }] });
    });
    return result;
  });

  async function copy() {
    await navigator.clipboard.writeText(debugText(info, status));
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<svelte:head><title>{info.exception}: {info.message}</title></svelte:head>

<div class="dbg">
  <header class="dbg__bar">
    <span class="dbg__brand">Flowaxy</span>
    <span class="dbg__pill">DEBUG</span>
    <span class="dbg__status">{status}</span>
    <span class="dbg__origin">{ORIGIN[info.origin]}</span>
    <span class="dbg__spacer"></span>
    <button type="button" class="dbg__btn" onclick={copy}>{copied ? 'Скопійовано' : 'Копіювати звіт'}</button>
    <button type="button" class="dbg__btn" onclick={() => location.reload()}>Оновити</button>
    <a class="dbg__btn" href="/">На головну</a>
  </header>

  <section class="dbg__hero">
    <span class="dbg__class">{info.exception}</span>
    <h1 class="dbg__message">{info.message || '(без повідомлення)'}</h1>
    <dl class="dbg__meta">
      {#if info.request}<div><dt>Запит</dt><dd><b>{info.request.method}</b> {info.request.url}</dd></div>{/if}
      {#if info.route}<div><dt>Маршрут</dt><dd>{info.route}</dd></div>{/if}
      {#if current}<div><dt>Місце</dt><dd>{shortPath(current.file)}:{current.line}</dd></div>{/if}
      <div><dt>Час</dt><dd>{$formatDateTime(info.at)}</dd></div>
    </dl>
  </section>

  <div class="dbg__body">
    <nav class="dbg__frames" aria-label="Стек викликів">
      <div class="dbg__framesHead">Стек викликів · {info.frames.length}</div>
      {#each groups as group, groupIndex (groupIndex)}
        {#if group.app || showVendor}
          {#each group.items as { frame, index } (index)}
            <button
              type="button"
              class="frame"
              class:is-app={frame.app}
              class:is-active={index === activeIndex}
              onclick={() => (selected = index)}
            >
              <span class="frame__no">{index + 1}</span>
              <span class="frame__body">
                <span class="frame__fn">{frame.fn}</span>
                <span class="frame__file">{shortPath(frame.file)}:{frame.line}</span>
              </span>
            </button>
          {/each}
        {:else}
          <button type="button" class="frame frame--vendor" onclick={() => (showVendor = true)}>
            + {group.items.length} {group.items.length === 1 ? 'кадр бібліотек' : 'кадрів бібліотек'}
          </button>
        {/if}
      {/each}
      {#if showVendor}
        <button type="button" class="frame frame--vendor" onclick={() => (showVendor = false)}>− сховати бібліотеки</button>
      {/if}
      {#if !info.frames.length}<p class="dbg__empty">Стек недоступний</p>{/if}
    </nav>

    <section class="dbg__code">
      {#if current}
        <header class="code__head">
          <span class="code__path">{shortPath(current.file)}<b>:{current.line}</b></span>
          <span class="code__fn">{current.fn}</span>
          {#if editorLink(current)}<a class="dbg__btn" href={editorLink(current)}>Відкрити у VS Code</a>{/if}
        </header>
        {#if current.snippet}
          <pre class="code"><code>{#each current.snippet as [number, text] (number)}<span class="code__line" class:is-hit={number === current.line}><span class="code__no">{number}</span>{text || ' '}</span>{/each}</code></pre>
        {:else}
          <p class="dbg__empty">Код недоступний для цього кадру{current.app ? '' : ' (бібліотека)'}.</p>
        {/if}
      {/if}
    </section>
  </div>
</div>

<style>
  .dbg {
    --d-bg: #f6f7f9;
    --d-surface: #ffffff;
    --d-border: #e3e6eb;
    --d-text: #1c2026;
    --d-muted: #6b7380;
    --d-accent: #e11d48;
    --d-code: #0f1218;
    --d-code-text: #d5dae3;
    --d-hit: rgba(225, 29, 72, 0.22);
    min-height: 100vh;
    background: var(--d-bg);
    color: var(--d-text);
    font: 14px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }

  :global([data-theme='dark']) .dbg {
    --d-bg: #0b0d12;
    --d-surface: #12151c;
    --d-border: #232833;
    --d-text: #e6e9ef;
    --d-muted: #8a93a3;
  }

  .dbg__bar {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 10px 24px;
    border-bottom: 1px solid var(--d-border);
    background: var(--d-surface);
  }

  .dbg__brand {
    font-weight: 800;
  }

  .dbg__pill,
  .dbg__status {
    padding: 1px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
  }

  .dbg__pill {
    background: var(--d-accent);
    color: #fff;
  }

  .dbg__status {
    border: 1px solid var(--d-border);
  }

  .dbg__origin {
    color: var(--d-muted);
    font-size: 12px;
  }

  .dbg__spacer {
    flex: 1;
  }

  .dbg__btn {
    padding: 5px 12px;
    border: 1px solid var(--d-border);
    border-radius: 4px;
    background: var(--d-surface);
    color: var(--d-text);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }

  .dbg__btn:hover {
    border-color: var(--d-accent);
    color: var(--d-accent);
  }

  .dbg__hero {
    padding: 28px 24px 24px;
    border-bottom: 1px solid var(--d-border);
    border-left: 4px solid var(--d-accent);
    background: var(--d-surface);
  }

  .dbg__class {
    color: var(--d-accent);
    font: 600 13px ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .dbg__message {
    margin: 6px 0 16px;
    font-size: clamp(18px, 2.4vw, 26px);
    font-weight: 700;
    line-height: 1.3;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .dbg__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 28px;
    margin: 0;
  }

  .dbg__meta div {
    display: grid;
    gap: 2px;
  }

  .dbg__meta dt {
    color: var(--d-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .dbg__meta dd {
    margin: 0;
    font: 13px ui-monospace, SFMono-Regular, Consolas, monospace;
    overflow-wrap: anywhere;
  }

  .dbg__body {
    display: grid;
    grid-template-columns: minmax(260px, 380px) minmax(0, 1fr);
    gap: 16px;
    padding: 16px 24px 32px;
  }

  .dbg__frames,
  .dbg__code {
    align-self: start;
    overflow: hidden;
    border: 1px solid var(--d-border);
    border-radius: 6px;
    background: var(--d-surface);
  }

  .dbg__framesHead {
    padding: 10px 14px;
    border-bottom: 1px solid var(--d-border);
    color: var(--d-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .frame {
    display: flex;
    gap: 10px;
    width: 100%;
    padding: 8px 14px;
    border: 0;
    border-bottom: 1px solid var(--d-border);
    border-left: 3px solid transparent;
    background: none;
    color: var(--d-muted);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .frame:hover {
    background: color-mix(in srgb, var(--d-accent) 5%, transparent);
  }

  .frame.is-app {
    color: var(--d-text);
  }

  .frame.is-active {
    border-left-color: var(--d-accent);
    background: color-mix(in srgb, var(--d-accent) 9%, transparent);
  }

  .frame__no {
    flex: none;
    min-width: 18px;
    color: var(--d-muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .frame__body {
    display: grid;
    min-width: 0;
  }

  .frame__fn {
    font-size: 13px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .frame__file {
    color: var(--d-muted);
    font: 11px ui-monospace, SFMono-Regular, Consolas, monospace;
    overflow-wrap: anywhere;
  }

  .frame--vendor {
    justify-content: center;
    font-size: 12px;
    font-style: italic;
  }

  .code__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--d-border);
  }

  .code__path {
    font: 13px ui-monospace, SFMono-Regular, Consolas, monospace;
    overflow-wrap: anywhere;
  }

  .code__path b {
    color: var(--d-accent);
  }

  .code__fn {
    flex: 1;
    color: var(--d-muted);
    font-size: 12px;
  }

  .code {
    margin: 0;
    padding: 10px 0;
    overflow-x: auto;
    background: var(--d-code);
    color: var(--d-code-text);
    font: 12.5px/1.65 ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .code__line {
    display: block;
    padding-right: 16px;
    white-space: pre;
  }

  .code__line.is-hit {
    background: var(--d-hit);
    box-shadow: inset 3px 0 0 var(--d-accent);
  }

  .code__no {
    display: inline-block;
    width: 52px;
    margin-right: 14px;
    padding-right: 10px;
    color: #5d6573;
    text-align: right;
    user-select: none;
  }

  .is-hit .code__no {
    color: #fff;
  }

  .dbg__empty {
    margin: 0;
    padding: 16px;
    color: var(--d-muted);
  }

  @media (max-width: 860px) {
    .dbg__body {
      grid-template-columns: 1fr;
      padding: 12px 16px 24px;
    }

    .dbg__code {
      order: -1;
    }

    .dbg__bar,
    .dbg__hero {
      padding-inline: 16px;
    }
  }
</style>
