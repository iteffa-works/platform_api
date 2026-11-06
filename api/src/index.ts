import './types/express.js';
import { app, clientApi, platformApi } from './app.js';
import { config } from './config/index.js';
import { connectDb } from './core/db/index.js';
import { loadPlugins } from './core/plugins/index.js';

if (config.isProduction && config.secret === 'dev-only-change-me') {
  throw new Error('APP_SECRET обовʼязковий у production');
}

await connectDb();
await loadPlugins({ platform: platformApi, client: clientApi });

app.listen(config.port, '127.0.0.1', () => {
  console.log(`API http://127.0.0.1:${config.port}`);
});
