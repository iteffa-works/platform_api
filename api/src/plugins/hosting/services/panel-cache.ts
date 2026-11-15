/**
 * Кеш читань панелі: сортування, фільтри й сторінки таблиць перерендерюють сторінку — без кешу кожен клік
 * був би запитом до панелі. Ключ — сервер + розділ + власник; TTL короткий (зміни ззовні видно за ~20 с),
 * будь-яка зміна через платформу скидає кеш сервера одразу.
 */
export class PanelCache {
  private readonly entries = new Map<string, { expires: number; value: Promise<unknown> }>();

  constructor(private readonly ttlMs = 20_000, private readonly maxEntries = 500) {}

  /** Значення з кешу або завантажити; помилка не кешується */
  get<T>(serverId: number, key: string, load: () => Promise<T>): Promise<T> {
    const id = `${serverId}|${key}`;
    const now = Date.now();
    const hit = this.entries.get(id);
    if (hit && hit.expires > now) return hit.value as Promise<T>;

    const value = load();
    this.entries.set(id, { expires: now + this.ttlMs, value });
    value.catch(() => this.entries.delete(id));
    if (this.entries.size > this.maxEntries) this.prune(now);
    return value;
  }

  /** Скинути все про сервер (після будь-якої зміни в його панелі) */
  invalidate(serverId: number): void {
    const prefix = `${serverId}|`;
    for (const key of this.entries.keys()) if (key.startsWith(prefix)) this.entries.delete(key);
  }

  private prune(now: number): void {
    for (const [key, entry] of this.entries) if (entry.expires <= now) this.entries.delete(key);
    // Усе ще забагато — прибрати найстаріші
    for (const key of [...this.entries.keys()].slice(0, Math.max(0, this.entries.size - this.maxEntries))) this.entries.delete(key);
  }
}
