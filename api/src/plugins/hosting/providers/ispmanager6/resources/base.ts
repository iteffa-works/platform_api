import type { IspTransport } from '../transport.js';

/** Розділ панелі: спільний транспорт і параметр `su` (дія від імені користувача) */
export abstract class IspResource {
  constructor(protected readonly isp: IspTransport) {}

  /** `su=<owner>` — бачення / дії користувача панелі; без owner — адміністратор */
  protected as(owner?: string): Record<string, string> {
    return owner ? { su: owner } : {};
  }

  /** Видалення обʼєкта (`<func>.delete`) від імені власника */
  protected async delete(func: string, elid: string, owner?: string, extra: Record<string, string> = {}): Promise<void> {
    await this.isp.call(`${func}.delete`, { ...this.as(owner), ...extra, elid, sok: 'ok' });
  }
}
