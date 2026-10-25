import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../shared/http/index.js';
import { requireUser } from '../../shared/middleware/index.js';
import * as checksService from './checks.service.js';

export function checkRoutes(router: Router): void {
  router.use('/checks', requireUser);

  router.get('/checks', asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    res.json({ checks: await checksService.listChecks(req.userId) });
  }));

  router.post('/checks', asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    const check = await checksService.createCheck(req.userId, req.body);
    res.status(201).json({ check });
  }));

  router.get('/checks/:id', asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    res.json({ check: await checksService.getCheck(req.userId, req.params.id) });
  }));

  router.post('/checks/:id/cancel', asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    res.json({ check: await checksService.cancelCheck(req.userId, req.params.id) });
  }));
}
