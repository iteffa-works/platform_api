import type { Router } from 'express';
import { asyncRoute } from '../../shared/http/index.js';
import { requireClient } from '../../shared/middleware/index.js';
import * as clientApiService from './service.js';
import { readWorkResult } from './validators.js';

export function clientApiRoutes(router: Router): void {
  router.use(requireClient);

  router.get('/status', asyncRoute(async (_req, res) => {
    res.json(clientApiService.clientStatus());
  }));

  /** Отримати наступне завдання для локальної обробки */
  router.get('/work/next', asyncRoute(async (_req, res) => {
    const work = await clientApiService.claimNext();
    res.json({ work });
  }));

  /** Відзвітувати результат локальної обробки */
  router.post('/work/:id/result', asyncRoute(async (req, res) => {
    const result = await clientApiService.submitResult(req.params.id, readWorkResult(req.body));
    res.json(result);
  }));
}
