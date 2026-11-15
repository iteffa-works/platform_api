import type { FtpApi, FtpUser, NewFtpUser } from '../../contracts.js';
import { ownedBy } from '../mapper.js';
import { field } from '../transport.js';
import { IspResource } from './base.js';

/** FTP-користувачі (`ftp.user`) */
export class IspFtp extends IspResource implements FtpApi {
  async list(owner?: string): Promise<FtpUser[]> {
    return (await this.isp.list('ftp.user', this.as(owner)))
      .filter((elem) => ownedBy(elem, owner))
      .map((elem) => ({ name: field(elem, 'name'), owner: field(elem, 'owner') || owner || '', home: field(elem, 'home') || null }));
  }

  async create(input: NewFtpUser): Promise<void> {
    await this.isp.save('ftp.user.edit', {
      ...this.as(input.owner),
      name: input.name,
      passwd: input.password,
      confirm: input.password,
      home: input.home ?? '/',
    });
  }

  async remove(name: string, owner?: string): Promise<void> {
    await this.delete('ftp.user', name, owner);
  }
}
