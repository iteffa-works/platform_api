import type { Certificate, SslApi } from '../../contracts.js';
import { isOn, list, ownedBy } from '../mapper.js';
import { field } from '../transport.js';
import { IspResource } from './base.js';

/** SSL-сертифікати (`sslcert`) — перегляд; випуск Let's Encrypt — у налаштуваннях сайту панелі */
export class IspSsl extends IspResource implements SslApi {
  async list(owner?: string): Promise<Certificate[]> {
    return (await this.isp.list('sslcert', this.as(owner)))
      .filter((elem) => ownedBy(elem, owner))
      .map((elem) => ({
        key: field(elem, 'key') || field(elem, 'name'),
        name: field(elem, 'name'),
        owner: field(elem, 'owner') || owner || '',
        domains: list(field(elem, 'info') || field(elem, 'webdomains')),
        validUntil: field(elem, 'valid_after') || null,
        letsencrypt: isOn(elem, 'is_letsencrypt') || isOn(elem, 'letsencrypt'),
        active: field(elem, 'active') !== 'off',
      }));
  }
}
