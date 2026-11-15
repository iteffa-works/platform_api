/** Помічники сторінок адмінки (server-driven): state таблиці, переклад з запасним текстом, дрібні вузли */
import type { UiButton, UiContext, UiNode } from '../../../core/ui/index.js';

export type GridState = {
  page: number;
  perPage: number;
  offset: number;
  sort: { key: string; dir: 'asc' | 'desc' };
};

const PER_PAGE = [20, 50, 100];

/**
 * Пагінація й сортування з state (`?page`, `?perPage`, `?sort=key|-key`);
 * невідомий ключ сортування — значення за замовчуванням.
 */
export function gridState(state: Record<string, string>, sortable: string[], fallback: string): GridState {
  const perPage = PER_PAGE.includes(Number(state.perPage)) ? Number(state.perPage) : PER_PAGE[0]!;
  const page = Math.max(1, Math.trunc(Number(state.page)) || 1);
  const raw = state.sort || fallback;
  const key = raw.replace(/^-/, '');
  const sort = sortable.includes(key)
    ? { key, dir: raw.startsWith('-') ? 'desc' as const : 'asc' as const }
    : { key: fallback.replace(/^-/, ''), dir: fallback.startsWith('-') ? 'desc' as const : 'asc' as const };
  return { page, perPage, offset: (page - 1) * perPage, sort };
}

/** Опис сторінки для вузла datagrid */
export function pageOf(ctx: UiContext, grid: GridState, total: number) {
  const from = total ? grid.offset + 1 : 0;
  const to = Math.min(total, grid.offset + grid.perPage);
  return { page: grid.page, perPage: grid.perPage, total, perPageOptions: PER_PAGE, summary: ctx.t('admin.grid.summary', { from, to, total }) };
}

/** Переклад динамічного ключа (дія журналу, роль, ресурс) з запасним текстом */
export function tx(ctx: UiContext, key: string, fallback: string, params?: Record<string, string | number>): string {
  const text = ctx.t(key, params);
  return text === key ? fallback : text;
}

/** Назва ролі мовою інтерфейсу */
export const roleLabel = (ctx: UiContext, role: { slug: string; name: string }) => tx(ctx, `role.${role.slug}`, role.name);

/** Іконка-дія (кнопка з іконкою; підпис — підказка) */
export function act(label: string, icon: string, extra: Partial<UiButton> = {}): UiButton {
  return { type: 'button', label, icon, ...extra };
}

/** Текст у клітинці: основний рядок і дрібний підпис */
export function lines(main: string, caption?: string | null): UiNode[] {
  return caption ? [{ type: 'text', text: main }, { type: 'text', text: caption, tone: 'muted', size: 'sm' }] : [{ type: 'text', text: main }];
}

/** Пристрій з User-Agent: «Chrome · Windows» */
export function describeAgent(agent: string | null | undefined): string {
  if (!agent) return '—';
  const browser = /Edg\//.test(agent) ? 'Edge'
    : /OPR\//.test(agent) ? 'Opera'
      : /Firefox\//.test(agent) ? 'Firefox'
        : /Chrome\//.test(agent) ? 'Chrome'
          : /Safari\//.test(agent) ? 'Safari'
            : /curl|node|undici|python|httpx/i.test(agent) ? 'API'
              : 'Browser';
  const os = /Windows/.test(agent) ? 'Windows'
    : /Android/.test(agent) ? 'Android'
      : /iPhone|iPad|iOS/.test(agent) ? 'iOS'
        : /Mac OS X|Macintosh/.test(agent) ? 'macOS'
          : /Linux/.test(agent) ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}

/** Екранування `%` і `_` для LIKE */
export const likeOf = (text: string) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
