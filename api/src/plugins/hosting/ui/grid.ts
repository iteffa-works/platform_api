/**
 * Таблиці хостингу (datagrid): стан з URL (`?q`, `?sort=key|-key`, `?page`, `?perPage`), сторінка й підсумок.
 * - Дані з БД — сортування / сторінка в SQL (сервіси).
 * - Дані з панелі (API панелі без пагінації) — `localGrid`: фільтр, сортування й сторінка на сервері
 *   над кешованим списком (PanelCache); у браузер іде лише видима сторінка.
 */
import type { GridTone, UiContext, UiNode } from '../../../core/ui/index.js';

export const PER_PAGE = [20, 50, 100];

export type GridQuery = {
  page: number;
  perPage: number;
  offset: number;
  sort: { key: string; dir: 'asc' | 'desc' };
  q: string;
};

/** Стан таблиці з URL; невідомий ключ сортування — за замовчуванням (`-key` — спадання) */
export function gridQuery(state: Record<string, string>, sortable: string[], fallback: string): GridQuery {
  const perPage = PER_PAGE.includes(Number(state.perPage)) ? Number(state.perPage) : PER_PAGE[0]!;
  const page = Math.max(1, Math.trunc(Number(state.page)) || 1);
  const raw = state.sort || fallback;
  const key = raw.replace(/^-/, '');
  const sort = sortable.includes(key)
    ? { key, dir: raw.startsWith('-') ? 'desc' as const : 'asc' as const }
    : { key: fallback.replace(/^-/, ''), dir: fallback.startsWith('-') ? 'desc' as const : 'asc' as const };
  return { page, perPage, offset: (page - 1) * perPage, sort, q: (state.q ?? '').trim().slice(0, 100) };
}

/** Опис сторінки для datagrid (з підсумком «1–20 з 134») */
export function pageInfo(ctx: UiContext, query: GridQuery, total: number) {
  const from = total ? query.offset + 1 : 0;
  const to = Math.min(total, query.offset + query.perPage);
  return { page: query.page, perPage: query.perPage, total, perPageOptions: PER_PAGE, summary: ctx.t('grid.summary', { from, to, total }) };
}

type SortValue = string | number | boolean | null | undefined;

/**
 * Фільтр, сортування й сторінка над готовим списком (дані панелі).
 * `text` — рядок для пошуку; `sort` — значення колонок для сортування (null — у кінці).
 */
export function localGrid<T>(items: T[], query: GridQuery, options: { text: (item: T) => string; sort: Record<string, (item: T) => SortValue> }) {
  const needle = query.q.toLowerCase();
  const filtered = needle ? items.filter((item) => options.text(item).toLowerCase().includes(needle)) : items;
  const value = options.sort[query.sort.key];
  const sorted = value
    ? [...filtered].sort((left, right) => {
      const a = value(left);
      const b = value(right);
      if (a === b) return 0;
      if (a === null || a === undefined) return 1;
      if (b === null || b === undefined) return -1;
      const order = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true });
      return query.sort.dir === 'desc' ? -order : order;
    })
    : filtered;
  // Сторінка поза межами (після видалення) — остання доступна
  const pages = Math.max(1, Math.ceil(sorted.length / query.perPage));
  const page = Math.min(query.page, pages);
  const effective = { ...query, page, offset: (page - 1) * query.perPage };
  return { rows: sorted.slice(effective.offset, effective.offset + query.perPage), total: sorted.length, query: effective };
}

export type GridColumn = { key: string; label: string; align?: 'left' | 'right' | 'center'; width?: string; sortable?: boolean };
export type GridRow = { key: string | number; tone?: GridTone; cells: Record<string, UiNode[]> };
export type GridToolbar = Extract<UiNode, { type: 'datagrid' }>['toolbar'];

/** Вузол datagrid з типовими налаштуваннями */
export function datagrid(options: {
  columns: GridColumn[];
  rows: GridRow[];
  query?: GridQuery;
  total?: number;
  ctx: UiContext;
  toolbar?: GridToolbar;
  empty: string;
  /** Без пагінації (короткі довідники) */
  paged?: boolean;
}): UiNode {
  const { query, total, ctx } = options;
  return {
    type: 'datagrid',
    columns: options.columns,
    rows: options.rows,
    toolbar: options.toolbar,
    sort: query?.sort,
    page: options.paged === false || !query ? undefined : pageInfo(ctx, query, total ?? options.rows.length),
    empty: query?.q ? ctx.t('grid.nothing') : options.empty,
  };
}

/** Пошук панелі інструментів */
export function searchBox(ctx: UiContext, query: GridQuery, placeholder?: string) {
  return { name: 'q', value: query.q, placeholder: placeholder ?? ctx.t('search') };
}
