import { describe, expect, it, vi } from 'vitest';
import { PanelCache } from './panel-cache.js';

describe('кеш читань панелі', () => {
  it('повторне читання — з кешу, інший ключ / сервер — окремо', async () => {
    const cache = new PanelCache();
    const load = vi.fn(async () => ['a']);
    await cache.get(1, 'sites', load);
    await cache.get(1, 'sites', load);
    await cache.get(1, 'sites|demo', load);
    await cache.get(2, 'sites', load);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('invalidate скидає лише свій сервер', async () => {
    const cache = new PanelCache();
    const load = vi.fn(async () => 1);
    await cache.get(1, 'x', load);
    await cache.get(2, 'x', load);
    cache.invalidate(1);
    await cache.get(1, 'x', load);
    await cache.get(2, 'x', load);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('помилка не кешується, TTL минає', async () => {
    const cache = new PanelCache(5);
    let fail = true;
    const load = vi.fn(async () => {
      if (fail) throw new Error('down');
      return 'ok';
    });
    await expect(cache.get(1, 'x', load)).rejects.toThrow('down');
    fail = false;
    expect(await cache.get(1, 'x', load)).toBe('ok');
    await new Promise((resolve) => setTimeout(resolve, 10));
    await cache.get(1, 'x', load);
    expect(load).toHaveBeenCalledTimes(3);
  });
});
