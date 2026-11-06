import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../shared/http/index.js';
import { requireUser } from '../../shared/middleware/index.js';
import * as authService from './service.js';
import { readCredentials } from './validators.js';

export function authRoutes(router: Router): void {
  router.post('/auth/register', asyncRoute(async (req, res) => {
    const { email, password } = readCredentials(req.body);
    res.status(201).json(await authService.register(email, password));
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
