import express, { type Router } from 'express';
import { asyncRoute, readIdParam } from '../../../shared/http/index.js';
import { sessionIdOf, userIdOf } from '../../../shared/middleware/index.js';
import { requireUser } from '../access.js';
import { AVATAR_MAX_BYTES } from '../avatar.js';
import * as details from './details.js';
import * as cabinet from './service.js';

/** Кабінет: власний акаунт користувача (без окремих прав) */
export function cabinetRoutes(router: Router): void {
  router.use('/cabinet', requireUser);

  router.get('/cabinet/profile', asyncRoute(async (req, res) => {
    res.json(await cabinet.profile(userIdOf(req)));
  }));

  router.patch('/cabinet/account', asyncRoute(async (req, res) => {
    res.json(await cabinet.updateAccount(req, userIdOf(req), req.body));
  }));

  router.delete('/cabinet/account', asyncRoute(async (req, res) => {
    await cabinet.deleteAccount(userIdOf(req), req.body);
    res.status(204).end();
  }));

  router.patch('/cabinet/preferences', asyncRoute(async (req, res) => {
    res.json(await cabinet.updatePreferences(userIdOf(req), req.body));
  }));

  router.post('/cabinet/password', asyncRoute(async (req, res) => {
    res.json(await cabinet.changePassword(req, userIdOf(req), sessionIdOf(req), req.body));
  }));

  // Сесії (пристрої)
  router.get('/cabinet/sessions', asyncRoute(async (req, res) => {
    res.json(await details.sessionList(userIdOf(req), sessionIdOf(req)));
  }));

  router.delete('/cabinet/sessions', asyncRoute(async (req, res) => {
    res.json(await cabinet.endOtherSessions(req, userIdOf(req), sessionIdOf(req)));
  }));

  router.delete('/cabinet/sessions/:id', asyncRoute(async (req, res) => {
    const sessionId = readIdParam(req.params.id, 'Сесію не знайдено');
    await cabinet.endSession(req, userIdOf(req), sessionIdOf(req), sessionId);
    res.status(204).end();
  }));

  // 2FA
  router.post('/cabinet/2fa/setup', asyncRoute(async (req, res) => {
    res.json(await cabinet.twoFactorSetup(userIdOf(req)));
  }));

  router.post('/cabinet/2fa/enable', asyncRoute(async (req, res) => {
    res.json(await cabinet.twoFactorEnable(req, userIdOf(req), req.body));
  }));

  router.post('/cabinet/2fa/disable', asyncRoute(async (req, res) => {
    await cabinet.twoFactorDisable(req, userIdOf(req), req.body);
    res.status(204).end();
  }));

  // Аватар: тіло запиту — сам файл (image/*), без multipart
  router.put(
    '/cabinet/avatar',
    express.raw({ type: 'image/*', limit: AVATAR_MAX_BYTES }),
    asyncRoute(async (req, res) => {
      res.json(await cabinet.uploadAvatar(req, userIdOf(req), req.body));
    }),
  );

  router.delete('/cabinet/avatar', asyncRoute(async (req, res) => {
    await cabinet.deleteAvatar(req, userIdOf(req));
    res.status(204).end();
  }));

  router.get('/cabinet/referrals', asyncRoute(async (req, res) => {
    res.json(await cabinet.referrals(userIdOf(req)));
  }));

  // Персональні дані (для рахунків)
  router.get('/cabinet/details', asyncRoute(async (req, res) => {
    res.json(await details.details(userIdOf(req)));
  }));

  router.put('/cabinet/details', asyncRoute(async (req, res) => {
    res.json(await details.updateDetails(req, userIdOf(req), req.body));
  }));

  // SSH-ключі
  router.get('/cabinet/ssh-keys', asyncRoute(async (req, res) => {
    res.json(await details.sshKeys(userIdOf(req)));
  }));

  router.post('/cabinet/ssh-keys', asyncRoute(async (req, res) => {
    res.status(201).json(await details.addSshKey(req, userIdOf(req), req.body));
  }));

  router.delete('/cabinet/ssh-keys/:id', asyncRoute(async (req, res) => {
    await details.removeSshKey(req, userIdOf(req), readIdParam(req.params.id, 'Ключ не знайдено'));
    res.status(204).end();
  }));
}
