/**
 * Консоль панелі сервера (адмінка): `/admin/hosting/servers/:id/panel/<розділ>`.
 * Перегляд — hosting:view, зміни — hosting:manage. `?owner=` — від імені користувача панелі.
 */
import type { Request, Response, Router } from 'express';
import { asyncRoute } from '../../../shared/http/index.js';
import type { HostingModule } from '../module.js';
import { actor, body, guard, params } from './guards.js';

export function panelRoutes(router: Router, hosting: HostingModule): void {
  const P = '/admin/hosting/servers/:id/panel';
  const panel = hosting.panel;
  const done = (res: Response) => (result?: unknown) => (result ? res.json(result) : res.status(204).end());
  const get = (path: string, fn: (req: Request) => Promise<unknown>) =>
    router.get(`${P}${path}`, ...guard.view, asyncRoute(async (req, res) => res.json(await fn(req))));
  const change = (method: 'post' | 'delete', path: string, fn: (req: Request) => Promise<unknown>) =>
    router[method](`${P}${path}`, ...guard.manage, asyncRoute(async (req, res) => done(res)(await fn(req))));

  get('/overview', (req) => panel.overview(params.server(req)));

  /* Користувачі панелі */
  get('/users', (req) => hosting.servers.panelAccounts(params.server(req)));
  change('post', '/users', (req) => panel.createPanelUser(actor(req), params.server(req), body(req)));
  change('post', '/users/:key/suspend', (req) => panel.setPanelUserState(actor(req), params.server(req), params.key(req), 'suspend'));
  change('post', '/users/:key/resume', (req) => panel.setPanelUserState(actor(req), params.server(req), params.key(req), 'resume'));
  change('post', '/users/:key/password', (req) => panel.setPanelUserPassword(actor(req), params.server(req), params.key(req), body(req).password));
  change('post', '/users/:key/login', (req) => panel.panelLoginUrl(actor(req), params.server(req), params.key(req)));
  change('delete', '/users/:key', (req) => panel.removePanelUser(actor(req), params.server(req), params.key(req)));

  /* Сайти */
  get('/sites', async (req) => ({ sites: await panel.sites(params.server(req), params.owner(req)) }));
  change('post', '/sites', (req) => panel.createSite(actor(req), params.server(req), body(req)));
  change('delete', '/sites/:key', (req) => panel.removeSite(actor(req), params.server(req), params.key(req), params.owner(req)));

  /* DNS */
  get('/dns', async (req) => ({ zones: await panel.zones(params.server(req), params.owner(req)) }));
  change('post', '/dns', (req) => panel.createZone(actor(req), params.server(req), body(req)));
  change('delete', '/dns/:key', (req) => panel.removeZone(actor(req), params.server(req), params.key(req), params.owner(req)));
  get('/dns/:key/records', async (req) => ({ records: await panel.records(params.server(req), params.key(req)) }));
  change('post', '/dns/:key/records', (req) => panel.addRecord(actor(req), params.server(req), params.key(req), body(req)));
  change('delete', '/dns/:key/records', (req) => panel.removeRecord(actor(req), params.server(req), params.key(req), String(body(req).record ?? '')));

  /* Пошта */
  get('/mail', async (req) => {
    const [domains, boxes] = await Promise.all([panel.mailDomains(params.server(req), params.owner(req)), panel.mailboxes(params.server(req), params.owner(req))]);
    return { domains, boxes };
  });
  change('post', '/mail/domains', (req) => panel.createMailDomain(actor(req), params.server(req), body(req)));
  change('delete', '/mail/domains/:key', (req) => panel.removeMailDomain(actor(req), params.server(req), params.key(req), params.owner(req)));
  change('post', '/mail/boxes', (req) => panel.createMailbox(actor(req), params.server(req), body(req)));
  change('post', '/mail/boxes/:key/password', (req) => panel.setMailboxPassword(actor(req), params.server(req), params.key(req), body(req).password, params.owner(req)));
  change('delete', '/mail/boxes/:key', (req) => panel.removeMailbox(actor(req), params.server(req), params.key(req), params.owner(req)));

  /* Бази даних */
  get('/databases', async (req) => ({ databases: await panel.databases(params.server(req), params.owner(req)) }));
  change('post', '/databases', (req) => panel.createDatabase(actor(req), params.server(req), body(req)));
  change('delete', '/databases/:key', (req) => panel.removeDatabase(actor(req), params.server(req), params.key(req), params.owner(req)));

  /* FTP */
  get('/ftp', async (req) => ({ users: await panel.ftp(params.server(req), params.owner(req)) }));
  change('post', '/ftp', (req) => panel.createFtp(actor(req), params.server(req), body(req)));
  change('delete', '/ftp/:key', (req) => panel.removeFtp(actor(req), params.server(req), params.key(req), params.owner(req)));

  /* SSL, cron */
  get('/ssl', async (req) => ({ certificates: await panel.certificates(params.server(req), params.owner(req)) }));
  get('/cron', async (req) => ({ jobs: await panel.cron(params.server(req), params.owner(req)) }));
  change('post', '/cron', (req) => panel.createCron(actor(req), params.server(req), body(req)));
  change('delete', '/cron', (req) => panel.removeCron(actor(req), params.server(req), String(body(req).key ?? ''), params.owner(req)));
}
