import cors from 'cors';
import express from 'express';
import { config } from './config/index.js';
import { errorHandler } from './shared/http/index.js';

/** Platform API для web (без client-обмежень) */
export const platformApi = express.Router();
/** Client API для desktop/скриптів */
export const clientApi = express.Router();

/** Збірка Express-додатку */
export function createApp() {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      callback(null, !origin || config.clientOrigins.includes(origin));
    },
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/v1', platformApi);
  app.use('/api/client/v1', clientApi);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Не знайдено' }));
  app.use(errorHandler);

  return app;
}

export const app = createApp();
