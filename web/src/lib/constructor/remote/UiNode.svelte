<script lang="ts">
  /**
   * Вузол схеми → компоненти UI-kit (рекурсивно). Складні вузли — окремі компоненти:
   * UiTable (таблиця з пошуком), UiForm, UiButtonNode (дія / перехід / модальне вікно), UiMenu (⋯).
   * Новий тип вузла — тут і в schema.ts (API + web).
   */
  import { Alert, PersonCell } from '$lib/ui/admin';
  import { EmptyState } from '$lib/ui/components';
  import { Badge, Flag, Icon, Ring, type IconName } from '$lib/ui/elements';
  import type { UiNode } from './schema.js';
  import Self from './UiNode.svelte';
  import UiActions from './UiActions.svelte';
  import UiButtonNode from './UiButtonNode.svelte';
  import UiDataGrid from './UiDataGrid.svelte';
  import UiForm from './UiForm.svelte';
  import UiInline from './UiInline.svelte';
  import UiMenu from './UiMenu.svelte';
  import UiTable from './UiTable.svelte';

  let { node }: { node: UiNode } = $props();

  const icon = (name: string | undefined) => name as IconName;
  const badgeTone = (tone: string | undefined) => (tone === 'red' ? 'orange' : tone ?? 'slate') as 'blue' | 'purple' | 'green' | 'orange' | 'slate';
</script>

{#snippet children(nodes: UiNode[])}
  {#each nodes as child, index (index)}<Self node={child} />{/each}
{/snippet}

{#if node.type === 'stack'}
  <div class="stack" style:gap="{node.gap ?? 12}px">{@render children(node.children)}</div>
{:else if node.type === 'row'}
  <div class="row" data-justify={node.justify ?? 'start'} data-align={node.align ?? 'center'}>{@render children(node.children)}</div>
{:else if node.type === 'grid'}
  <div class="grid" style:--min="{node.min ?? 240}px">{@render children(node.children)}</div>
{:else if node.type === 'panel'}
  <section class="panel">
    {#if node.title || node.actions?.length}
      <header class="panel__head">
        <div class="panel__titles">
          {#if node.title}<h2 class="panel__title">{node.title}</h2>{/if}
          {#if node.subtitle}<p class="panel__subtitle">{node.subtitle}</p>{/if}
        </div>
        {#if node.actions?.length}<div class="panel__actions">{@render children(node.actions)}</div>{/if}
      </header>
    {/if}
    <div class="panel__body" class:is-flush={node.flush}>{@render children(node.children)}</div>
  </section>
{:else if node.type === 'stats'}
  <div class="stats">
    {#each node.items as item, index (index)}
      <svelte:element this={item.href ? 'a' : 'div'} class="stat" href={item.href} data-tone={item.tone ?? 'blue'}>
        {#if item.icon}<span class="stat__icon"><Icon name={icon(item.icon)} size={20} /></span>{/if}
        <span class="stat__body">
          <span class="stat__label">{item.label}</span>
          <span class="stat__value"><UiInline value={item.value} /></span>
          {#if item.hint}<span class="stat__hint"><UiInline value={item.hint} /></span>{/if}
        </span>
      </svelte:element>
    {/each}
  </div>
{:else if node.type === 'menu'}
  <UiMenu items={node.items} label={node.label} />
{:else if node.type === 'breadcrumbs'}
  <nav class="crumbs" aria-label="breadcrumbs">
    {#each node.items as item, index (index)}
      {#if index > 0}<span class="crumbs__sep" aria-hidden="true">/</span>{/if}
      {#if item.href && index < node.items.length - 1}<a href={item.href}>{item.label}</a>{:else}<span aria-current="page">{item.label}</span>{/if}
    {/each}
  </nav>
{:else if node.type === 'progress'}
  <div class="progress" data-tone={node.tone ?? 'blue'}>
    <div class="progress__track"><div class="progress__bar" style:width="{node.value ?? 0}%"></div></div>
    {#if node.label}<span class="progress__label"><UiInline value={node.label} />{#if node.value !== null} · {node.value}%{/if}</span>{/if}
  </div>
{:else if node.type === 'tabs'}
  <nav class="tabs">
    {#each node.items as item (item.href)}<a class:is-active={item.active} href={item.href} aria-current={item.active ? 'page' : undefined}>{item.label}</a>{/each}
  </nav>
{:else if node.type === 'banner'}
  <p class="banner" data-tone={node.tone ?? 'slate'}><UiInline value={node.text} /></p>
{:else if node.type === 'text'}
  <p class="text" data-tone={node.tone ?? 'body'} data-size={node.size ?? 'md'} class:is-bold={node.bold}><UiInline value={node.text} /></p>
{:else if node.type === 'heading'}
  {#if node.level === 3}<h3 class="heading is-small"><UiInline value={node.text} /></h3>{:else}<h2 class="heading"><UiInline value={node.text} /></h2>{/if}
{:else if node.type === 'badge'}
  <Badge tone={badgeTone(node.tone)}>{node.text}</Badge>
{:else if node.type === 'link'}
  <a class="link" href={node.href} target={node.external ? '_blank' : undefined} rel={node.external ? 'noopener noreferrer' : undefined}>{node.text}</a>
{:else if node.type === 'fields'}
  <dl class="fields">
    {#each node.items as item, index (index)}<dt>{item.label}</dt><dd><UiInline value={item.value} /></dd>{/each}
  </dl>
{:else if node.type === 'table'}
  <UiTable {node} />
{:else if node.type === 'datagrid'}
  <UiDataGrid {node} />
{:else if node.type === 'alert'}
  {@const button = node.action}
  <Alert tone={node.tone ?? 'info'}>
    <UiInline value={node.text} />
    {#snippet action()}{#if button}<UiButtonNode node={button} />{/if}{/snippet}
  </Alert>
{:else if node.type === 'person'}
  <PersonCell name={node.name} caption={node.caption} seed={node.seed} src={node.src} href={node.href} />
{:else if node.type === 'actions'}
  <UiActions items={node.items} />
{:else if node.type === 'ring'}
  <Ring value={node.value} size={node.size} />
{:else if node.type === 'flag'}
  <Flag code={node.code} size={node.size} round={node.round} />
{:else if node.type === 'icon'}
  <Icon name={icon(node.name)} size={node.size} />
{:else if node.type === 'status'}
  <span class="status" data-tone={node.tone}>{#if node.icon}<Icon name={icon(node.icon)} size={18} />{/if}</span>
{:else if node.type === 'tile'}
  <section class="tile" data-tone={node.tone}>
    <div class="tile__body">
      {#if node.media}<div class="tile__media"><Self node={node.media} /></div>{/if}
      <div class="stack tile__content">{@render children(node.children)}</div>
    </div>
    {#if node.footer}<UiButtonNode node={node.footer} className="tile__foot" />{/if}
  </section>
{:else if node.type === 'empty'}
  <EmptyState text={node.text} />
{:else if node.type === 'code'}
  {#if node.block}<pre class="code-block">{node.text}</pre>{:else}<code class="code">{node.text}</code>{/if}
{:else if node.type === 'button'}
  <UiButtonNode {node} />
{:else if node.type === 'form'}
  <UiForm {node} />
{/if}

<style>
  .stack {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    min-width: 0;
  }

  .row[data-justify='between'] { justify-content: space-between; }
  .row[data-justify='end'] { justify-content: flex-end; }
  .row[data-align='start'] { align-items: flex-start; }
  .row[data-align='center'] { align-items: center; }
  .row[data-align='end'] { align-items: flex-end; }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(var(--min), 100%), 1fr));
    gap: 16px;
    align-items: start;
  }

  /* Панель: плоска картка з тонкою рамкою */
  .panel {
    min-width: 0;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, 12px);
    background: var(--ui-surface);
    box-shadow: var(--ui-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  }

  .panel__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--ui-border-soft, var(--ui-border));
  }

  .panel__title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }

  .panel__subtitle {
    margin: 2px 0 0;
    color: var(--ui-muted);
    font-size: 13px;
  }

  .panel__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .panel__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .panel__body.is-flush {
    gap: 0;
    padding: 0;
  }

  /* Показники */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
    gap: 12px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, 12px);
    background: var(--ui-surface);
    color: inherit;
    text-decoration: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  a.stat:hover {
    border-color: var(--tone);
    box-shadow: var(--ui-shadow-md, 0 8px 24px rgba(15, 23, 42, 0.08));
  }

  .stat__icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--tone) 14%, transparent);
    color: var(--tone);
  }

  .stat__body {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .stat__label {
    color: var(--ui-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .stat__value {
    font-size: 22px;
    font-weight: 800;
    line-height: 1.2;
  }

  .stat__hint {
    color: var(--ui-muted);
    font-size: 12px;
  }

  /* Хлібні крихти */
  .crumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    color: var(--ui-muted);
    font-size: 13px;
  }

  .crumbs a {
    color: inherit;
    text-decoration: none;
  }

  .crumbs a:hover {
    color: var(--ui-accent);
  }

  .crumbs [aria-current] {
    color: var(--ui-text);
    font-weight: 600;
  }

  .crumbs__sep {
    opacity: 0.5;
  }

  /* Смуга заповнення */
  .progress {
    display: grid;
    gap: 4px;
    width: 100%;
    min-width: 120px;
  }

  .progress__track {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--ui-surface-muted);
    box-shadow: inset 0 0 0 1px var(--ui-border-soft, var(--ui-border));
  }

  .progress__bar {
    height: 100%;
    border-radius: inherit;
    background: var(--tone);
    transition: width 0.3s;
  }

  .progress__label {
    color: var(--ui-muted);
    font-size: 12px;
    white-space: nowrap;
  }

  /* Вкладки */
  /* Підкреслення — тінню всередині пункту: без відʼємних відступів, тож немає вертикального переповнення й смуги прокрутки */
  .tabs {
    display: flex;
    gap: 2px;
    overflow-x: auto;
    overflow-y: hidden;
    box-shadow: inset 0 -1px 0 var(--ui-border);
    scrollbar-width: none;
  }

  .tabs::-webkit-scrollbar {
    display: none;
  }

  .tabs a {
    flex: none;
    padding: 10px 14px;
    color: var(--ui-muted);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }

  .tabs a:hover {
    color: var(--ui-text);
  }

  .tabs a.is-active {
    box-shadow: inset 0 -2px 0 var(--ui-accent);
    color: var(--ui-accent);
  }

  .banner {
    margin: 0;
    padding: 12px 16px;
    border: 1px solid var(--ui-border);
    border-radius: 10px;
    background: var(--ui-surface-muted);
    font-size: 14px;
    font-weight: 600;
  }

  .banner[data-tone='red'] {
    border-color: color-mix(in srgb, var(--ui-danger) 30%, transparent);
    background: color-mix(in srgb, var(--ui-danger) 10%, transparent);
    color: var(--ui-danger);
  }

  .banner[data-tone='orange'] {
    border-color: color-mix(in srgb, var(--ui-tone-orange) 30%, transparent);
    background: color-mix(in srgb, var(--ui-tone-orange) 10%, transparent);
    color: var(--ui-tone-orange);
  }

  .banner[data-tone='green'] {
    border-color: color-mix(in srgb, var(--ui-tone-green) 30%, transparent);
    background: color-mix(in srgb, var(--ui-tone-green) 10%, transparent);
    color: var(--ui-success);
  }

  .text {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .text[data-size='sm'] { font-size: 13px; }
  .text[data-size='lg'] { font-size: 18px; }
  .text[data-size='xl'] { font-size: 22px; }
  .text[data-tone='muted'] { color: var(--ui-muted); }
  .text[data-tone='error'] { color: var(--ui-danger); }
  .text[data-tone='success'] { color: var(--ui-success); }
  .text[data-tone='warn'] { color: var(--ui-tone-orange); }
  .text.is-bold { font-weight: 700; }

  .heading {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
  }

  .heading.is-small {
    font-size: 15px;
  }

  .link {
    color: var(--ui-text);
    font-weight: 700;
    text-decoration: none;
  }

  .link:hover {
    color: var(--ui-accent);
    text-decoration: underline;
  }

  .fields {
    display: grid;
    grid-template-columns: minmax(110px, max-content) 1fr;
    gap: 8px 16px;
    margin: 0;
    font-size: 14px;
  }

  .fields dt {
    color: var(--ui-muted);
  }

  .fields dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .status {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--tone) 14%, transparent);
    color: var(--tone);
  }

  [data-tone='green'] { --tone: var(--ui-tone-green); }
  [data-tone='orange'] { --tone: var(--ui-tone-orange); }
  [data-tone='red'] { --tone: var(--ui-danger); }
  [data-tone='slate'] { --tone: var(--ui-tone-slate); }
  [data-tone='blue'] { --tone: var(--ui-tone-blue); }
  [data-tone='purple'] { --tone: var(--ui-tone-purple); }

  /* Кольорові плитки (картка акаунта в кабінеті) */
  .tile {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--ui-radius-lg, 12px);
    background: var(--tile);
    color: #fff;
  }

  .tile[data-tone='blue'] { --tile: #3b7dd8; --foot: #2f69b9; }
  .tile[data-tone='green'] { --tile: #22a079; --foot: #1b8665; }
  .tile[data-tone='slate'] { --tile: #64748b; --foot: #556378; }
  .tile[data-tone='orange'] { --tile: #e07b28; --foot: #c4691f; }
  .tile[data-tone='purple'] { --tile: #7c5bd6; --foot: #6748bd; }
  .tile[data-tone='red'] { --tile: #d14d47; --foot: #b83f39; }

  .tile__body {
    display: flex;
    flex: 1;
    gap: 16px;
    padding: 18px;
  }

  .tile__media :global(.status) {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: var(--foot);
  }

  .tile__content {
    gap: 4px;
  }

  .tile :global(.text[data-tone='muted']),
  .tile :global(.text[data-tone='warn']) {
    color: rgba(255, 255, 255, 0.85);
  }

  .tile :global(.linkbtn) {
    color: #ffe58a;
  }

  .tile :global(.ring .label) {
    color: #fff;
  }

  .tile :global(.tile__foot) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px;
    border: 0;
    background: var(--foot);
    color: #fff;
    font: inherit;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }

  .tile :global(.tile__foot:hover:not(:disabled)) {
    filter: brightness(1.08);
  }

  .tile :global(.tile__foot:disabled) {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .code {
    padding: 2px 6px;
    border-radius: 5px;
    background: var(--ui-surface-muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .code-block {
    max-height: 420px;
    margin: 0;
    overflow: auto;
    padding: 12px;
    border-radius: 8px;
    background: var(--ui-surface-muted);
    font-size: 12px;
  }
</style>
