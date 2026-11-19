/**
 * Область розділів кабінету (сайти, DNS, пошта, БД, FTP, SSL, cron) для одного хостинг-акаунта:
 * дані — з копії в БД (`hosting.resources`), дії — REST `/cabinet/hosting/:id/panel/<розділ>`.
 */
import type { GridTone, UiContext, UiNode } from '../../../../flowaxy/ui/index.js';
import type { HostingAccount } from '../../domain/models.js';
import { datagrid, gridQuery, localGrid, searchBox, type GridColumn, type GridToolbar } from '../grid.js';

export class PanelScope {
  /** REST розділів акаунта */
  readonly api: string;
  /** Сторінка акаунта (вкладки — `?tab=`) */
  readonly page: string;
  /** Зміни дозволені (акаунт активний — перевірено сторінкою) */
  readonly manage = true;

  constructor(readonly ctx: UiContext, readonly account: HostingAccount, options: { api: string; page: string }) {
    this.api = options.api;
    this.page = options.page;
  }

  get t() {
    return this.ctx.t;
  }

  /** Посилання на сторінку акаунта з параметрами (вкладка, зона, домен…) */
  href(params: Record<string, string | undefined>): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    const search = query.toString();
    return `${this.page}${search ? `?${search}` : ''}`;
  }

  /** Таблиця розділу: пошук, сортування й сторінка на сервері над списком з копії; розділ описує колонки й рядок */
  async grid<T>(items: T[], options: {
    columns: GridColumn[];
    defaultSort: string;
    sort: Record<string, (item: T) => string | number | boolean | null | undefined>;
    text: (item: T) => string;
    row: (item: T) => { key: string | number; tone?: GridTone; cells: Record<string, UiNode[]> };
    empty: string;
    segments?: NonNullable<GridToolbar>['segments'];
  }): Promise<UiNode> {
    const query = gridQuery(this.ctx.state, Object.keys(options.sort), options.defaultSort);
    const page = localGrid(items, query, { text: options.text, sort: options.sort });
    return datagrid({
      ctx: this.ctx,
      query: page.query,
      total: page.total,
      toolbar: { segments: options.segments, search: searchBox(this.ctx, query) },
      columns: options.columns.map((column) => ({ ...column, sortable: column.key in options.sort })),
      rows: page.rows.map(options.row),
      empty: options.empty,
    });
  }
}

export type PanelSectionRenderer = (scope: PanelScope) => Promise<UiNode[]>;
