import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../shared/http/index.js';
import { requireUser } from '../../shared/middleware/index.js';
import * as accountsService from './service.js';
import { readApiHash, readApiId, readLabel } from './validators.js';

export function accountRoutes(router: Router): void {
  router.use('/accounts', requireUser);

  router.get('/accounts', asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    res.json(await accountsService.listAccounts(req.userId));
  }));

  router.post('/accounts', asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    res.status(201).json(await accountsService.createAccount(req.userId, {
      label: readLabel(req.body?.label),
      apiId: readApiId(req.body?.apiId),
      apiHash: readApiHash(req.body?.apiHash),
    }));
  }));

  router.patch('/accounts/:id', asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    res.json(await accountsService.updateAccount(req.userId, req.params.id, req.body ?? {}));
  }));

  router.delete('/accounts/:id', asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    await accountsService.deleteAccount(req.userId, req.params.id);
    res.status(204).end();
  }));
}
