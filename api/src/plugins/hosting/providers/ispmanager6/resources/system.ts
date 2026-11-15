import type { PhpVersion, ServiceState, SystemApi, SystemInfo } from '../../contracts.js';
import { field, original, type IspDoc } from '../transport.js';
import { IspResource } from './base.js';

function text(doc: IspDoc | null, key: string): string | null {
  const value = doc?.[key];
  if (typeof value === 'string') return value || null;
  if (value && typeof value === 'object' && '$' in value) return String((value as { $: unknown }).$) || null;
  return null;
}

/** Сервер: версія, ліцензія, залізо (`sysinfo`), служби, IP, версії PHP — лише перегляд */
export class IspSystem extends IspResource implements SystemApi {
  async info(): Promise<SystemInfo> {
    const [whoami, license, sysinfo] = await Promise.all([
      this.isp.call('whoami'),
      this.isp.call('license.info').catch(() => null),
      this.isp.list('sysinfo').catch(() => []),
    ]);
    const mgr = whoami.mgr as Record<string, unknown> | undefined;
    return {
      panel: text(license, 'panel_name') ?? 'ISPmanager',
      version: (typeof mgr?.version === 'string' ? mgr.version : null) ?? text(license, 'panel_info'),
      os: text(license, 'os'),
      license: license ? { id: text(license, 'licid'), name: text(license, 'licname'), expires: text(license, 'licdate') } : null,
      hardware: sysinfo.map((elem) => ({ name: field(elem, 'name') || original(elem, 'type'), value: field(elem, 'value') })),
    };
  }

  async services(): Promise<ServiceState[]> {
    return (await this.isp.list('services')).map((elem) => ({
      name: field(elem, 'name'),
      running: field(elem, 'state') === 'started',
      autostart: field(elem, 'autostart') === 'yes',
    }));
  }

  async ips(): Promise<string[]> {
    return (await this.isp.list('ipaddrlist')).map((elem) => field(elem, 'name')).filter(Boolean);
  }

  async php(): Promise<PhpVersion[]> {
    return (await this.isp.list('phpversions')).map((elem) => ({
      key: field(elem, 'key'),
      name: field(elem, 'name'),
      installed: field(elem, 'state') === 'installed',
    }));
  }
}
