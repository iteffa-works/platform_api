/**
 * Кабінет: лише власні акаунти (пошук за id + userId).
 * Ресурси акаунта — `/cabinet/hosting/:id/panel/<розділ>`: власник завжди = логін акаунта,
 * акаунт — власний, активний, сервер увімкнено. Читання — з копії в БД.
 */
import type { Request, Router } from 'express';
import { userIdOf } from '../../../shared/middleware/index.js';
import type { HostingAccount } from '../domain/models.js';
import type { HostingModule } from '../module.js';
import type { Actor } from '../services/resource.service.js';
import { body, created, guard, json, params } from './guards.js';

export function cabinetRoutes(router: Router, hosting: HostingModule): void {
  const C = '/cabinet/hosting';
  const { accounts, orders, resources } = hosting;
  const me = (req: Request) => userIdOf(req);

  /* Ресурси акаунта (до /:id, щоб шляхи /:id/panel/* не перехоплювались) */
  type Own = (account: HostingAccount, req: Request, actor: Actor) => Promise<unknown>;
  const own = (handler: Own) => json(async (req) => {
    const account = await accounts.usable(me(req), params.account(req));
    return handler(account, req, { req, actorId: me(req) });
  });
  const P = `${C}/:id/panel`;
  const key = params.key;

  router.get(`${P}/sites`, ...guard.user, own(async (a) => ({ sites: await resources.list(a, 'site') })));
  router.post(`${P}/sites`, ...guard.user, own((a, req, actor) => resources.createSite(actor, a, body(req))));
  router.delete(`${P}/sites/:key`, ...guard.user, own((a, req, actor) => resources.removeSite(actor, a, key(req))));

  router.get(`${P}/dns`, ...guard.user, own(async (a) => ({ zones: await resources.list(a, 'zone') })));
  router.post(`${P}/dns`, ...guard.user, own((a, req, actor) => resources.createZone(actor, a, body(req))));
  router.delete(`${P}/dns/:key`, ...guard.user, own((a, req, actor) => resources.removeZone(actor, a, key(req))));
  router.get(`${P}/dns/:key/records`, ...guard.user, own(async (a, req) => ({ records: await resources.records(a, key(req)) })));
  router.post(`${P}/dns/:key/records`, ...guard.user, own((a, req, actor) => resources.addRecord(actor, a, key(req), body(req))));
  router.delete(`${P}/dns/:key/records`, ...guard.user, own((a, req, actor) => resources.removeRecord(actor, a, key(req), String(body(req).record ?? ''))));

  router.get(`${P}/mail`, ...guard.user, own(async (a) => {
    const [domains, boxes] = await Promise.all([resources.list(a, 'maildomain'), resources.list(a, 'mailbox')]);
    return { domains, boxes };
  }));
  router.post(`${P}/mail/domains`, ...guard.user, own((a, req, actor) => resources.createMailDomain(actor, a, body(req))));
  router.delete(`${P}/mail/domains/:key`, ...guard.user, own((a, req, actor) => resources.removeMailDomain(actor, a, key(req))));
  router.post(`${P}/mail/boxes`, ...guard.user, own((a, req, actor) => resources.createMailbox(actor, a, body(req))));
  router.post(`${P}/mail/boxes/:key/password`, ...guard.user, own((a, req, actor) => resources.setMailboxPassword(actor, a, key(req), body(req).password)));
  router.delete(`${P}/mail/boxes/:key`, ...guard.user, own((a, req, actor) => resources.removeMailbox(actor, a, key(req))));

  router.get(`${P}/databases`, ...guard.user, own(async (a) => ({ databases: await resources.list(a, 'database') })));
  router.post(`${P}/databases`, ...guard.user, own((a, req, actor) => resources.createDatabase(actor, a, body(req))));
  router.delete(`${P}/databases/:key`, ...guard.user, own((a, req, actor) => resources.removeDatabase(actor, a, key(req))));

  router.get(`${P}/ftp`, ...guard.user, own(async (a) => ({ users: await resources.list(a, 'ftp') })));
  router.post(`${P}/ftp`, ...guard.user, own((a, req, actor) => resources.createFtp(actor, a, body(req))));
  router.delete(`${P}/ftp/:key`, ...guard.user, own((a, req, actor) => resources.removeFtp(actor, a, key(req))));

  router.get(`${P}/ssl`, ...guard.user, own(async (a) => ({ certificates: await resources.list(a, 'ssl') })));

  router.get(`${P}/cron`, ...guard.user, own(async (a) => ({ jobs: await resources.list(a, 'cron') })));
  router.post(`${P}/cron`, ...guard.user, own((a, req, actor) => resources.createCron(actor, a, body(req))));
  router.delete(`${P}/cron`, ...guard.user, own((a, req, actor) => resources.removeCron(actor, a, String(body(req).key ?? ''))));

  /* Акаунти */
  router.get(C, ...guard.user, json((req) => accounts.listMine(me(req))));
  router.get(`${C}/catalog`, ...guard.user, json((req) => orders.catalog(me(req))));
  router.post(`${C}/order`, ...guard.user, created((req) => orders.order(req, me(req), body(req))));

  router.patch(`${C}/:id`, ...guard.user, json((req) => accounts.updateMine(me(req), params.account(req), body(req))));
  router.post(`${C}/:id/renew`, ...guard.user, json((req) => orders.renew(req, me(req), params.account(req), body(req).months)));
  router.post(`${C}/:id/plan`, ...guard.user, json((req) => orders.changePlan(req, me(req), params.account(req), body(req).planId)));
  router.post(`${C}/:id/usage`, ...guard.user, json((req) => accounts.syncMine(me(req), params.account(req))));
  router.post(`${C}/:id/login`, ...guard.user, json((req) => accounts.loginUrlMine(req, me(req), params.account(req))));
  router.post(`${C}/:id/password`, ...guard.user, json(async (req) => void (await accounts.changePasswordMine(req, me(req), params.account(req), body(req).password))));
  router.delete(`${C}/:id`, ...guard.user, json(async (req) => void (await accounts.deleteMine(req, me(req), params.account(req), body(req).confirm))));
}
