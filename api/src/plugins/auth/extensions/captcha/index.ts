import type { Router } from 'express';
import { asyncRoute } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import type { AuthExtension, AuthHookContext } from '../types.js';
import { createCaptchaChallenge, verifyCaptchaAnswer } from './service.js';

function verifyCaptcha(ctx: AuthHookContext): void {
  verifyCaptchaAnswer(
    String(ctx.body.captchaToken ?? ''),
    String(ctx.body.captchaAnswer ?? ''),
  );
}

function captchaRoutes(router: Router): void {
  router.get('/auth/captcha', asyncRoute(async (_req, res) => {
    if (!authConfig.captcha) {
      res.json({ enabled: false, captchaToken: '', image: '' });
      return;
    }
    res.json({ enabled: true, ...createCaptchaChallenge() });
  }));
}

/**
 * Завжди підключене: при AUTH_CAPTCHA=false маршрут віддає `enabled: false`,
 * а перевірка пропускається — web ховає поле без помилки 404.
 */
export const extension: AuthExtension = {
  name: 'captcha',
  routes: captchaRoutes,
  beforeRegister: verifyCaptcha,
  beforeLogin: verifyCaptcha,
};
