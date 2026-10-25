import type { Router } from 'express';

export function healthRoutes(router: Router): void {
  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
}
