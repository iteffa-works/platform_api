import type { Router } from 'express';
import { asyncRoute } from '../../shared/http/index.js';
import { requireUser, userIdOf } from '../../shared/middleware/index.js';
import * as accountsService from './service.js';
import { readApiHash, readApiId, readLabel } from './validators.js';

export function accountRoutes(router: Router): void {
  router.use('/accounts', requireUser);

  router.get('/accounts', asyncRoute(async (req, res) => {
    res.json(await accountsService.listAccounts(userIdOf(req)));
  }));

  router.post('/accounts', asyncRoute(async (req, res) => {
    res.status(201).json(await accountsService.createAccount(userIdOf(req), {
      label: readLabel(req.body?.label),
      apiId: readApiId(req.body?.apiId),
      apiHash: readApiHash(req.body?.apiHash),
    }));
  }));

  router.patch('/accounts/:id', asyncRoute(async (req, res) => {
    res.json(await accountsService.updateAccount(userIdOf(req), req.params.id, req.body ?? {}));
  }));

  router.delete('/accounts/:id', asyncRoute(async (req, res) => {
    await accountsService.deleteAccount(userIdOf(req), req.params.id);
    res.status(204).end();
  }));
}
