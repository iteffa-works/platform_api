import type { UiContext, UiNode } from '../../../../../../flowaxy/ui/index.js';
import type { ServerView } from '../../../../services/presenter.js';
import { ADMIN } from '../../../kit.js';

export type ProviderInfo = { id: string; title: string; urlHint: string; capabilities: string[] };

/** Сторінка сервера в адмінці: контекст рендеру, сервер, провайдери, права, адреси */
export class ServerContext {
  readonly manage: boolean;
  /** Сторінка сервера (вкладки — `?tab=`) */
  readonly page: string;
  /** REST сервера */
  readonly api: string;

  constructor(readonly ctx: UiContext, readonly server: ServerView, readonly providers: ProviderInfo[]) {
    this.manage = ctx.can('hosting', 'manage');
    this.page = `${ADMIN}/servers/${server.id}`;
    this.api = this.page;
  }

  get t() {
    return this.ctx.t;
  }
}

export type ServerTab = (server: ServerContext) => Promise<UiNode[]>;
