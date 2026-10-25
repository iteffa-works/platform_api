import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../shared/http/index.js';
import { requireUser } from '../../shared/middleware/index.js';
import * as authService from './auth.service.js';
import { readCredentials } from './auth.validators.js';

export function authRoutes(router: Router): void {
  router.post('/auth/register', asyncRoute(async (req, res) => {
    const { email, password } = readCredentials(req.body);
    const result = await authService.register(email, password);
    res.status(201).json(result);
  }));

  router.post('/auth/login', asyncRoute(async (req, res) => {
    const { email, password } = readCredentials(req.body);
    res.json(await authService.login(email, password));
  }));

  router.get('/auth/me', requireUser, asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    res.json(await authService.me(req.userId));
  }));
}
