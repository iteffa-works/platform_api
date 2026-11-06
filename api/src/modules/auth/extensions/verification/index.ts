import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import type { AuthExtension, AuthHookContext } from '../types.js';

const METHODS = new Set(['email', 'phone', 'invite']);

async function beforeRegister(ctx: AuthHookContext): Promise<void> {
  const method = String(ctx.body.verificationMethod ?? '').trim();
  if (!METHODS.has(method)) {
    throw new HttpError(400, 'Оберіть спосіб верифікації');
  }
  // Повна перевірка коду — наступний етап розширення
}

function routes(router: Router): void {
  router.get('/auth/verification/methods', asyncRoute(async (_req, res) => {
    res.json({
      methods: [
        { id: 'email', title: 'Email', description: 'Підтвердження через лист на пошту', available: true },
        { id: 'phone', title: 'Телефон', description: 'SMS-код (скоро)', available: false },
        { id: 'invite', title: 'Запрошення', description: 'Код від адміністратора', available: true },
      ],
    });
  }));

  router.post('/auth/verification/start', asyncRoute(async (req, res) => {
    const method = String((req.body as { method?: string })?.method ?? '');
    if (!METHODS.has(method)) throw new HttpError(400, 'Невідомий спосіб верифікації');
    res.json({ ok: true, method, status: 'pending' });
  }));
}

/** Верифікація під час реєстрації */
export const extension: AuthExtension = {
  name: 'verification',
  enabled: authConfig.verification,
  routes,
  beforeRegister,
};
