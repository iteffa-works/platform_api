import type { NewSite, PanelSite, SitesApi } from '../../contracts.js';
import { isOn, list, ownedBy } from '../mapper.js';
import { field } from '../transport.js';
import { IspResource } from './base.js';

/** WWW-домени (`webdomain`) */
export class IspSites extends IspResource implements SitesApi {
  async list(owner?: string): Promise<PanelSite[]> {
    return (await this.isp.list('webdomain', this.as(owner)))
      .filter((elem) => ownedBy(elem, owner))
      .map((elem) => ({
        name: field(elem, 'name'),
        owner: field(elem, 'owner') || owner || '',
        docroot: field(elem, 'docroot') || null,
        ips: list(field(elem, 'ipaddr')),
        php: field(elem, 'php_version') || null,
        ssl: isOn(elem, 'secure'),
        active: field(elem, 'active') !== 'off',
      }));
  }

  /** Сайт з налаштуваннями панелі за замовчуванням; email — адреса вебмайстра */
  async create(input: NewSite): Promise<void> {
    await this.isp.save('webdomain.edit', {
      ...this.as(input.owner),
      name: input.name,
      aliases: input.aliases ?? `www.${input.name}`,
      email: `webmaster@${input.name}`,
      ipsrc: 'auto',
    });
  }

  async remove(name: string, owner?: string): Promise<void> {
    await this.delete('webdomain', name, owner);
  }
}
