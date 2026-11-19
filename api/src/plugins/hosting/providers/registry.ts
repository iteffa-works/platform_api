/** Реєстр панелей: id → провайдер. Нова панель — клас у `providers/<id>/` + рядок у `createProviderRegistry`. */
import { HttpError } from '../../../shared/http/index.js';
import type { HostingProvider } from './contracts.js';
import { IspManager6Provider } from './ispmanager6/provider.js';

export class ProviderRegistry {
  private readonly providers = new Map<string, HostingProvider>();

  constructor(providers: HostingProvider[]) {
    for (const provider of providers) this.register(provider);
  }

  register(provider: HostingProvider): void {
    if (this.providers.has(provider.id)) throw new Error(`Провайдер «${provider.id}» уже зареєстровано`);
    this.providers.set(provider.id, provider);
  }

  get(id: string): HostingProvider {
    const provider = this.providers.get(id);
    if (!provider) throw new HttpError(400, 'Невідомий тип панелі');
    return provider;
  }

  list() {
    return [...this.providers.values()].map(({ id, title, urlHint, capabilities }) => ({ id, title, urlHint, capabilities: [...capabilities] }));
  }
}

export function createProviderRegistry(): ProviderRegistry {
  return new ProviderRegistry([new IspManager6Provider()]);
}

export * from './contracts.js';
