<script lang="ts">
  /**
   * datagrid схеми: панель фільтрів (сегменти, select, пошук), сортування й пагінація.
   * Кожна зміна — параметр URL (`?<name>=`, `sort`, `page`, `perPage`) → RemotePage перерендерює сторінку
   * з цим state; фільтр скидає сторінку на першу.
   */
  import { goto } from '$app/navigation';
  import { page as route } from '$app/stores';
  import { get } from 'svelte/store';
  import { DataGrid, Pagination, SearchBox, Segmented, Select, Toolbar, type GridColumn, type GridSort } from '$lib/ui/admin';
  import type { UiNode as Node } from './schema.js';
  import UiNode from './UiNode.svelte';

  type Grid = Extract<Node, { type: 'datagrid' }>;
  type Row = Grid['rows'][number];

  let { node }: { node: Grid } = $props();

  function navigate(params: Record<string, string | number | null>, resetPage = true) {
    const url = new URL(get(route).url);
    for (const [name, value] of Object.entries(params)) {
      if (value === null || value === '') url.searchParams.delete(name);
      else url.searchParams.set(name, String(value));
    }
    if (resetPage) url.searchParams.delete('page');
    void goto(`${url.pathname}${url.search}`, { keepFocus: true, noScroll: true });
  }

  const sort = (value: GridSort) => navigate({ sort: value.dir === 'desc' ? `-${value.key}` : value.key });
  const toolbar = $derived(node.toolbar);
</script>

<div class="dg">
  {#if toolbar}
    <Toolbar>
      {#if toolbar.segments}
        {@const segments = toolbar.segments}
        <Segmented items={segments.items} value={segments.value} onchange={(value) => navigate({ [segments.name]: value })} />
      {/if}
      {#each toolbar.filters ?? [] as filter (filter.name)}
        <Select label={filter.label} value={filter.value} options={filter.options} onchange={(value) => navigate({ [filter.name]: value })} />
      {/each}
      {#snippet end()}
        {#if toolbar.search}
          {@const search = toolbar.search}
          <SearchBox value={search.value} placeholder={search.placeholder} onsearch={(value) => navigate({ [search.name]: value.trim() })} />
        {/if}
      {/snippet}
    </Toolbar>
  {/if}

  <DataGrid
    columns={node.columns as GridColumn[]}
    rows={node.rows}
    rowKey={(row: Row) => row.key}
    rowTone={(row: Row) => row.tone}
    sort={node.sort}
    onsort={sort}
    empty={node.empty}
  >
    {#snippet cell(row: Row, column: GridColumn)}
      <div class="dg__cell" data-align={column.align ?? 'left'}>
        {#each row.cells[column.key] ?? [] as child, index (index)}<UiNode node={child} />{/each}
      </div>
    {/snippet}
    {#snippet footer()}
      {#if node.page && node.page.total > 0}
        {@const page = node.page}
        <Pagination
          page={page.page}
          total={page.total}
          perPage={page.perPage}
          perPageOptions={page.perPageOptions}
          summary={page.summary}
          onpage={(value) => navigate({ page: value > 1 ? value : null }, false)}
          onperpage={(value) => navigate({ perPage: value })}
        />
      {/if}
    {/snippet}
  </DataGrid>
</div>

<style lang="scss">
  .dg {
    display: flex;
    flex-direction: column;
    gap: space(3);
    min-width: 0;
  }

  // Усередині панелі таблиця — частина картки: без власної рамки (flush) або без тіні
  :global(.panel__body.is-flush) > .dg :global(.grid) {
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  :global(.panel__body:not(.is-flush)) > .dg :global(.grid) {
    box-shadow: none;
  }

  .dg__cell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    min-width: 0;

    &[data-align='right'] { justify-content: flex-end; }
    &[data-align='center'] { justify-content: center; }

    // Текстові вузли в клітинці — без зовнішніх відступів, дрібніше
    :global(.text) {
      font-size: inherit;
    }

    :global(.text[data-size='sm']) {
      flex-basis: 100%;
      font-size: var(--ui-fs-xs);
    }
  }
</style>
