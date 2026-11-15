/**
 * Хуки платформи: дії (actions) і фільтри (filters) з пріоритетами.
 *
 * - **Дія** — «щось сталося»: `doAction('hosting.account.created', payload)`; підписники виконують побічні
 *   ефекти (журнал, сповіщення, інтеграції). Помилка підписника ізольована — не ламає інших і викликача.
 * - **Фільтр** — «дайте змінити значення»: `applyFilters('hosting.order.price', cents, ctx)`; кожен
 *   підписник отримує результат попереднього. Помилка фільтра — пропускається (значення без змін).
 *
 * Типи хуків оголошують модулі через declaration merging:
 * ```ts
 * declare module '../../core/hooks/index.js' {
 *   interface HookActions { 'hosting.account.created': { accountId: number } }
 *   interface HookFilters { 'hosting.order.price': [cents: number, ctx: { months: number }] }
 * }
 * ```
 * Невідомі імена теж дозволені (рядок) — для поступового переходу; тоді payload — unknown.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HookActions {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HookFilters {}

type ActionName = keyof HookActions | (string & {});
type ActionPayload<K> = K extends keyof HookActions ? HookActions[K] : unknown;
type FilterName = keyof HookFilters | (string & {});
type FilterValue<K> = K extends keyof HookFilters ? HookFilters[K] extends [infer V, ...unknown[]] ? V : unknown : unknown;
type FilterContext<K> = K extends keyof HookFilters ? HookFilters[K] extends [unknown, infer C] ? C : undefined : unknown;

export type HookOptions = {
  /** Менший — раніше (як у WordPress); за замовчуванням 10 */
  priority?: number;
  /** Хто підписався (діагностика, зняття всіх підписок модуля) */
  owner?: string;
  /** Умова дії підписки, напр. `() => isEnabled('hosting')` для addon */
  when?: () => boolean;
};

type Entry<F> = { fn: F; priority: number; owner?: string; when?: () => boolean; order: number };

export class HookManager {
  private readonly actions = new Map<string, Entry<(payload: unknown) => unknown>[]>();
  private readonly filters = new Map<string, Entry<(value: unknown, context: unknown) => unknown>[]>();
  private counter = 0;

  private insert<F>(map: Map<string, Entry<F>[]>, name: string, fn: F, options: HookOptions): () => void {
    const entry: Entry<F> = { fn, priority: options.priority ?? 10, owner: options.owner, when: options.when, order: this.counter++ };
    const list = [...(map.get(name) ?? []), entry].sort((left, right) => left.priority - right.priority || left.order - right.order);
    map.set(name, list);
    return () => map.set(name, (map.get(name) ?? []).filter((item) => item !== entry));
  }

  /** Підписатися на дію; повертає функцію відписки */
  addAction<K extends ActionName>(name: K, handler: (payload: ActionPayload<K>) => unknown, options: HookOptions = {}): () => void {
    return this.insert(this.actions, name, handler as (payload: unknown) => unknown, options);
  }

  /** Виконати дію: підписники послідовно за пріоритетом; помилки — в лог */
  async doAction<K extends ActionName>(name: K, payload: ActionPayload<K>): Promise<void> {
    for (const entry of this.actions.get(name) ?? []) {
      if (entry.when && !entry.when()) continue;
      try {
        await entry.fn(payload);
      } catch (error) {
        console.error(`[hooks] action ${name}${entry.owner ? ` (${entry.owner})` : ''}`, error);
      }
    }
  }

  /** Підписатися на фільтр; повертає функцію відписки */
  addFilter<K extends FilterName>(
    name: K,
    fn: (value: FilterValue<K>, context: FilterContext<K>) => FilterValue<K> | Promise<FilterValue<K>>,
    options: HookOptions = {},
  ): () => void {
    return this.insert(this.filters, name, fn as (value: unknown, context: unknown) => unknown, options);
  }

  /** Пропустити значення через фільтри за пріоритетом */
  async applyFilters<K extends FilterName>(name: K, value: FilterValue<K>, context?: FilterContext<K>): Promise<FilterValue<K>> {
    let current: unknown = value;
    for (const entry of this.filters.get(name) ?? []) {
      if (entry.when && !entry.when()) continue;
      try {
        current = await entry.fn(current, context);
      } catch (error) {
        console.error(`[hooks] filter ${name}${entry.owner ? ` (${entry.owner})` : ''}`, error);
      }
    }
    return current as FilterValue<K>;
  }

  hasAction(name: string): boolean {
    return (this.actions.get(name)?.length ?? 0) > 0;
  }

  /** Перелік підписок (діагностика / адмінка) */
  describe(): Array<{ kind: 'action' | 'filter'; name: string; owner?: string; priority: number }> {
    const rows: Array<{ kind: 'action' | 'filter'; name: string; owner?: string; priority: number }> = [];
    for (const [name, list] of this.actions) for (const item of list) rows.push({ kind: 'action', name, owner: item.owner, priority: item.priority });
    for (const [name, list] of this.filters) for (const item of list) rows.push({ kind: 'filter', name, owner: item.owner, priority: item.priority });
    return rows;
  }
}

/** Спільний екземпляр платформи */
export const hooks = new HookManager();
