import type { Router } from 'express';
import { asyncRoute } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import type { AuthExtension, AuthHookContext } from '../types.js';
import { createCaptchaChallenge, verifyCaptchaAnswer } from './service.js';

async function verifyCaptcha(ctx: AuthHookContext): Promise<void> {
  if (!authConfig.captcha) return;
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

export const extension: AuthExtension = {
  name: 'captcha',
  enabled: authConfig.captcha,
  routes: captchaRoutes,
  beforeRegister: verifyCaptcha,
  beforeLogin: verifyCaptcha,
};
