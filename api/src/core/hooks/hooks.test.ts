import { describe, expect, it, vi } from 'vitest';
import { HookManager } from './index.js';

describe('хуки', () => {
  it('дії: порядок за пріоритетом, потім за реєстрацією', async () => {
    const hooks = new HookManager();
    const calls: string[] = [];
    hooks.addAction('x', () => void calls.push('b'), { priority: 20 });
    hooks.addAction('x', () => void calls.push('a'));
    hooks.addAction('x', () => void calls.push('a2'));
    await hooks.doAction('x', null);
    expect(calls).toEqual(['a', 'a2', 'b']);
  });

  it('дії: помилка підписника не зупиняє інших', async () => {
    const hooks = new HookManager();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const after = vi.fn();
    hooks.addAction('x', () => { throw new Error('boom'); });
    hooks.addAction('x', after);
    await hooks.doAction('x', 1);
    expect(after).toHaveBeenCalledWith(1);
    spy.mockRestore();
  });

  it('фільтри: ланцюжок значень і контекст', async () => {
    const hooks = new HookManager();
    hooks.addFilter('price', (value, ctx) => (value as number) * (ctx as { months: number }).months);
    hooks.addFilter('price', (value) => (value as number) - 100, { priority: 20 });
    expect(await hooks.applyFilters('price', 1000, { months: 3 })).toBe(2900);
  });

  it('умова when і відписка', async () => {
    const hooks = new HookManager();
    let enabled = false;
    const fn = vi.fn();
    const off = hooks.addAction('x', fn, { when: () => enabled });
    await hooks.doAction('x', 1);
    enabled = true;
    await hooks.doAction('x', 2);
    off();
    await hooks.doAction('x', 3);
    expect(fn.mock.calls).toEqual([[2]]);
  });
});
