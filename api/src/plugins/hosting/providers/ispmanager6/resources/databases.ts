import type { Database, DatabasesApi, NewDatabase } from '../../contracts.js';
import { mb, ownedBy } from '../mapper.js';
import { field } from '../transport.js';
import { IspResource } from './base.js';

/** Бази даних (`db`); ключ — `pair` («імʼя->сервер») */
export class IspDatabases extends IspResource implements DatabasesApi {
  async list(owner?: string): Promise<Database[]> {
    return (await this.isp.list('db', this.as(owner)))
      .filter((elem) => ownedBy(elem, owner))
      .map((elem) => ({
        key: field(elem, 'pair') || `${field(elem, 'name')}->${field(elem, 'server')}`,
        name: field(elem, 'name'),
        owner: field(elem, 'owner') || owner || '',
        server: field(elem, 'server'),
        sizeMb: mb(elem, 'size'),
        users: Number(field(elem, 'user_count')) || 0,
      }));
  }

  /** База разом з новим користувачем (`user=*`) на першому сервері БД */
  async create(input: NewDatabase): Promise<void> {
    await this.isp.save('db.edit', {
      ...this.as(input.owner),
      name: input.name,
      user: '*',
      username: input.user,
      password: input.password,
      confirm: input.password,
      charset: input.charset ?? 'utf8mb4',
    });
  }

  async remove(key: string, owner?: string): Promise<void> {
    await this.delete('db', key, owner);
  }
}
