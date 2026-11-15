/**
 * Кабінет: керування ресурсами власного хостинг-акаунта — `/cabinet/hosting/:id/panel/<розділ>`.
 * Власник завжди = логін акаунта (owner з запиту ігнорується); акаунт — власний, активний, сервер увімкнено.
 * Ті самі методи PanelService, що й консоль адміністратора — без дублювання логіки.
 */
import type { Request, Response, Router } from 'express';
import { asyncRoute } from '../../../shared/http/index.js';
import { userIdOf } from '../../../shared/middleware/index.js';
import type { HostingModule } from '../module.js';
import type { Actor } from '../services/panel.service.js';
import { body, guard, params } from './guards.js';

type Scope = { serverId: number; owner: string; actor: Actor };

export function clientPanelRoutes(router: Router, hosting: HostingModule): void {
  const C = '/cabinet/hosting/:id/panel';
  const panel = hosting.panel;

  /** Власний активний акаунт → сервер, власник, дійова особа (клієнт) */
  const scope = async (req: Request): Promise<Scope> => {
    const userId = userIdOf(req);
    const account = await hosting.accounts.usable(userId, params.account(req));
    return { serverId: account.serverId, owner: account.panelUser, actor: { req, actorId: userId, client: true } };
  };
  /** Тіло з підставленим власником */
  const own = (req: Request, owner: string) => ({ ...body(req), owner });
  const send = (res: Response) => (result?: unknown) => (result ? res.json(result) : res.status(204).end());
  const get = (path: string, fn: (s: Scope, req: Request) => Promise<unknown>) =>
    router.get(`${C}${path}`, ...guard.user, asyncRoute(async (req, res) => res.json(await fn(await scope(req), req))));
  const change = (method: 'post' | 'delete', path: string, fn: (s: Scope, req: Request) => Promise<unknown>) =>
    router[method](`${C}${path}`, ...guard.user, asyncRoute(async (req, res) => send(res)(await fn(await scope(req), req))));

  get('/sites', async (s) => ({ sites: await panel.sites(s.serverId, s.owner) }));
  change('post', '/sites', (s, req) => panel.createSite(s.actor, s.serverId, own(req, s.owner)));
  change('delete', '/sites/:key', (s, req) => panel.removeSite(s.actor, s.serverId, params.key(req), s.owner));

  get('/dns', async (s) => ({ zones: await panel.zones(s.serverId, s.owner) }));
  change('post', '/dns', (s, req) => panel.createZone(s.actor, s.serverId, { ...own(req, s.owner), ip: '' }));
  change('delete', '/dns/:key', (s, req) => panel.removeZone(s.actor, s.serverId, params.key(req), s.owner));
  get('/dns/:key/records', async (s, req) => ({ records: await panel.records(s.serverId, params.key(req), s.owner) }));
  change('post', '/dns/:key/records', (s, req) => panel.addRecord(s.actor, s.serverId, params.key(req), body(req), s.owner));
  change('delete', '/dns/:key/records', (s, req) => panel.removeRecord(s.actor, s.serverId, params.key(req), String(body(req).record ?? ''), s.owner));

  get('/mail', async (s) => {
    const [domains, boxes] = await Promise.all([panel.mailDomains(s.serverId, s.owner), panel.mailboxes(s.serverId, s.owner)]);
    return { domains, boxes };
  });
  change('post', '/mail/domains', (s, req) => panel.createMailDomain(s.actor, s.serverId, own(req, s.owner)));
  change('delete', '/mail/domains/:key', (s, req) => panel.removeMailDomain(s.actor, s.serverId, params.key(req), s.owner));
  change('post', '/mail/boxes', (s, req) => panel.createMailbox(s.actor, s.serverId, own(req, s.owner)));
  change('post', '/mail/boxes/:key/password', (s, req) => panel.setMailboxPassword(s.actor, s.serverId, params.key(req), body(req).password, s.owner));
  change('delete', '/mail/boxes/:key', (s, req) => panel.removeMailbox(s.actor, s.serverId, params.key(req), s.owner));

  get('/databases', async (s) => ({ databases: await panel.databases(s.serverId, s.owner) }));
  change('post', '/databases', (s, req) => panel.createDatabase(s.actor, s.serverId, own(req, s.owner)));
  change('delete', '/databases/:key', (s, req) => panel.removeDatabase(s.actor, s.serverId, params.key(req), s.owner));

  get('/ftp', async (s) => ({ users: await panel.ftp(s.serverId, s.owner) }));
  change('post', '/ftp', (s, req) => panel.createFtp(s.actor, s.serverId, own(req, s.owner)));
  change('delete', '/ftp/:key', (s, req) => panel.removeFtp(s.actor, s.serverId, params.key(req), s.owner));

  get('/ssl', async (s) => ({ certificates: await panel.certificates(s.serverId, s.owner) }));

  get('/cron', async (s) => ({ jobs: await panel.cron(s.serverId, s.owner) }));
  change('post', '/cron', (s, req) => panel.createCron(s.actor, s.serverId, own(req, s.owner)));
  change('delete', '/cron', (s, req) => panel.removeCron(s.actor, s.serverId, String(body(req).key ?? ''), s.owner));
}
