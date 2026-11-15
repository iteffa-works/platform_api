import type { MailApi, Mailbox, MailDomain, NewMailbox, NewMailDomain } from '../../contracts.js';
import { isOn, mb, ownedBy } from '../mapper.js';
import { field, firstOption } from '../transport.js';
import { IspResource } from './base.js';

/** Пошта: поштові домени (`emaildomain`) і скриньки (`email`) */
export class IspMail extends IspResource implements MailApi {
  async domains(owner?: string): Promise<MailDomain[]> {
    return (await this.isp.list('emaildomain', this.as(owner)))
      .filter((elem) => ownedBy(elem, owner))
      .map((elem) => ({
        name: field(elem, 'name'),
        owner: field(elem, 'owner') || owner || '',
        active: field(elem, 'active') !== 'off',
        dkim: Boolean(field(elem, 'dkim')),
      }));
  }

  /** `ipsrc` поштового домену — конкретна IP-адреса: перша з варіантів форми панелі */
  async createDomain(input: NewMailDomain): Promise<void> {
    const form = await this.isp.call('emaildomain.edit', this.as(input.owner));
    const ip = firstOption(form, 'ipsrc');
    await this.isp.save('emaildomain.edit', { ...this.as(input.owner), name: input.name, ...(ip ? { ipsrc: ip } : {}) });
  }

  async removeDomain(name: string, owner?: string): Promise<void> {
    await this.delete('emaildomain', name, owner);
  }

  async boxes(owner?: string): Promise<Mailbox[]> {
    return (await this.isp.list('email', this.as(owner)))
      .filter((elem) => ownedBy(elem, owner))
      .map((elem) => {
        const forward = field(elem, 'forward');
        const quota = mb(elem, 'size_total');
        return {
          address: field(elem, 'name'),
          owner: field(elem, 'owner') || owner || '',
          active: isOn(elem, 'active'),
          usedMb: mb(elem, 'size_used'),
          quotaMb: quota && quota > 0 ? quota : null,
          forward: forward && forward !== '-' ? forward : null,
          note: field(elem, 'note') || null,
        };
      });
  }

  async createBox(input: NewMailbox): Promise<void> {
    await this.isp.save('email.edit', {
      ...this.as(input.owner),
      name: input.name,
      domainname: input.domain,
      passwd: input.password,
      confirm: input.password,
      ...(input.quotaMb ? { maxsize: String(input.quotaMb) } : {}),
    });
  }

  async removeBox(address: string, owner?: string): Promise<void> {
    await this.delete('email', address, owner);
  }

  async setBoxPassword(address: string, password: string, owner?: string): Promise<void> {
    await this.isp.save('email.edit', { ...this.as(owner), elid: address, passwd: password, confirm: password });
  }
}
