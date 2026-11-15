import type { UiContext, UiNode } from '../../../../../../core/ui/index.js';
import type { ServerView } from '../../../../services/presenter.js';
import { ADMIN } from '../../../kit.js';
import { PanelScope } from '../../../sections/scope.js';

/** Консоль адміністратора: усі власники, фільтр `?owner=`, сервер і провайдери для огляду / налаштувань */
export class ConsoleContext extends PanelScope {
  constructor(
    ctx: UiContext,
    readonly server: ServerView,
    readonly providers: Array<{ id: string; title: string; urlHint: string; capabilities: string[] }>,
  ) {
    super(ctx, server.id, {
      api: `${ADMIN}/servers/${server.id}/panel`,
      page: `${ADMIN}/servers/${server.id}`,
      manage: ctx.can('hosting', 'manage'),
    });
  }
}

export type ConsoleSection = (console: ConsoleContext) => Promise<UiNode[]>;
