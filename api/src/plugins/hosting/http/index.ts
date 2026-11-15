import type { Router } from 'express';
import type { HostingModule } from '../module.js';
import { adminRoutes } from './admin.routes.js';
import { cabinetRoutes } from './cabinet.routes.js';
import { clientPanelRoutes } from './client-panel.routes.js';
import { panelRoutes } from './panel.routes.js';

/** Усі REST-маршрути плагіна (права — у guards.ts) */
export function createRoutes(hosting: HostingModule) {
  return (router: Router): void => {
    adminRoutes(router, hosting);
    panelRoutes(router, hosting);
    // Розділи панелі кабінету — до /cabinet/hosting/:id, щоб шляхи /:id/panel/* не перехоплювались
    clientPanelRoutes(router, hosting);
    cabinetRoutes(router, hosting);
  };
}
