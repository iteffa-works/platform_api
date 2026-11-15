import type { DnsApi, DnsRecord, DnsZone, NewDnsRecord, NewDnsZone } from '../../contracts.js';
import { ownedBy } from '../mapper.js';
import { field } from '../transport.js';
import { IspResource } from './base.js';

/** Поле значення запису за типом: A/AAAA — ip, MX/NS/CNAME — domain, решта — value */
function valueField(type: string): string {
  if (type === 'a' || type === 'aaaa') return 'ip';
  if (type === 'mx' || type === 'ns' || type === 'cname' || type === 'dname') return 'domain';
  return 'value';
}

/** DNS: зони (`domain`) і записи (`domain.record`) */
export class IspDns extends IspResource implements DnsApi {
  async zones(owner?: string): Promise<DnsZone[]> {
    return (await this.isp.list('domain', this.as(owner)))
      .filter((elem) => ownedBy(elem, owner))
      .map((elem) => ({
        name: field(elem, 'name'),
        owner: field(elem, 'user') || owner || '',
        type: field(elem, 'dtype') || 'master',
        dnssec: field(elem, 'dnssecstatus') || null,
      }));
  }

  async createZone(input: NewDnsZone): Promise<void> {
    await this.isp.save('domain.edit', { ...this.as(input.owner), name: input.name, ip: input.ip });
  }

  async removeZone(name: string, owner?: string): Promise<void> {
    await this.delete('domain', name, owner);
  }

  async records(zone: string): Promise<DnsRecord[]> {
    return (await this.isp.list('domain.record', { elid: zone })).map((elem) => ({
      key: field(elem, 'rkey'),
      name: field(elem, 'name'),
      type: field(elem, 'rtype_hidden') || field(elem, 'rtype'),
      value: field(elem, 'value'),
      ttl: Number(field(elem, 'ttl')) || null,
    }));
  }

  async addRecord(zone: string, record: NewDnsRecord): Promise<void> {
    const type = record.type.toLowerCase();
    await this.isp.save('domain.record.edit', {
      plid: zone,
      name: record.name,
      rtype: type,
      ttl: String(record.ttl ?? 3600),
      [valueField(type)]: record.value,
      ...(record.priority !== undefined ? { priority: String(record.priority) } : {}),
    });
  }

  async removeRecord(zone: string, key: string): Promise<void> {
    await this.delete('domain.record', key, undefined, { plid: zone });
  }
}
