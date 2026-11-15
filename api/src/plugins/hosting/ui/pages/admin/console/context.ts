import type { UiContext, UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import type { ServerView } from '../../../../services/presenter.js';
import { ADMIN } from '../../../kit.js';

/** Усе, що потрібно розділу консолі: сервер, фільтр власника, права, базові адреси */
export class ConsoleContext {
  /** REST консолі: `/admin/hosting/servers/:id/panel` */
  readonly api: string;
  /** Сторінка консолі */
  readonly page: string;
  private ownersCache: Promise<string[]> | null = null;

  constructor(
    readonly ctx: UiContext,
    readonly server: ServerView,
    readonly providers: Array<{ id: string; title: string; urlHint: string; capabilities: string[] }>,
  ) {
    this.api = `${ADMIN}/servers/${server.id}/panel`;
    this.page = `${ADMIN}/servers/${server.id}`;
  }

  get t() {
    return this.ctx.t;
  }

  get manage(): boolean {
    return this.ctx.can('hosting', 'manage');
  }

  /** Фільтр власника з URL (`?owner=`) */
  get owner(): string | undefined {
    return this.ctx.state.owner || undefined;
  }

  /** `?owner=` для REST, щоб дії виконувались від імені того ж користувача */
  get ownerQuery(): string {
    return this.owner ? `?owner=${encodeURIComponent(this.owner)}` : '';
  }

  /** Користувачі панелі (власники обʼєктів) — один запит на рендер */
  owners(): Promise<string[]> {
    this.ownersCache ??= hosting.servers.panelAccounts(this.server.id)
      .then((data) => data.accounts.map((account) => account.login).sort())
      .catch(() => []);
    return this.ownersCache;
  }
}

export type ConsoleSection = (console: ConsoleContext) => Promise<UiNode[]>;
