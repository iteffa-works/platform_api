import './env.js';
import './paths.js';
import './types/express.js';
import { app, clientApi, platformApi } from './app.js';
import { config } from './config/index.js';
import { connectDb, sequelize } from './flowaxy/db/index.js';
import { loadPlugins } from './flowaxy/plugins/index.js';

// Production: секрети не можуть лишатися значеннями для розробки
if (config.isProduction) {
  if (config.secret === 'dev-only-change-me' || config.secret.length < 32) throw new Error('APP_SECRET: унікальний рядок ≥ 32 символів обовʼязковий у production');
  if (config.clientApiKey === 'dev-client-key') throw new Error('CLIENT_API_KEY: задайте власний ключ у production');
  if (config.debug) console.warn('[api] APP_DEBUG увімкнено в production — стеки помилок видно назовні. Вимкніть: APP_DEBUG=false');
}

await connectDb();
await loadPlugins({ platform: platformApi, client: clientApi });

const server = app.listen(config.port, '127.0.0.1', () => {
  console.log(`API http://127.0.0.1:${config.port}`);
});

// Порт зайнятий — зазвичай API вже запущено в іншому терміналі: зрозуміле повідомлення замість стеку
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code !== 'EADDRINUSE') throw error;
  console.error(`[api] порт ${config.port} уже зайнятий — API, найімовірніше, вже запущено (інший термінал / вкладка).`);
  console.error('[api] Зупиніть той процес (Ctrl+C у його терміналі) або запустіть з іншим портом: PORT=4001 npm run dev');
  process.exit(1);
});

// Зупинка (PM2 / systemd / Docker): дочекатися поточних запитів, закрити пул БД
let stopping = false;
function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  console.log(`[api] ${signal}: зупинка…`);
  server.close(() => {
    void sequelize.close().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
