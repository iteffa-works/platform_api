import type { Router } from 'express';
import type { HostingModule } from '../module.js';
import { adminRoutes } from './admin.routes.js';
import { cabinetRoutes } from './cabinet.routes.js';
import { publicRoutes } from './public.routes.js';

/** Усі REST-маршрути плагіна (доступ — у guards.ts через порт платформи) */
export function createRoutes(hosting: HostingModule) {
  return (router: Router): void => {
    publicRoutes(router, hosting);
    adminRoutes(router, hosting);
    cabinetRoutes(router, hosting);
  };
}
