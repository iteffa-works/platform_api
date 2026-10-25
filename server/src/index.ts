import './types/express.js';
import { app } from './app.js';
import { config } from './config/index.js';
import { connectDb } from './db/index.js';
import './models/index.js';

if (config.isProduction && config.secret === 'dev-only-change-me') {
  throw new Error('APP_SECRET обовʼязковий у production');
}

await connectDb();
app.listen(config.port, '127.0.0.1', () => {
  console.log(`API http://127.0.0.1:${config.port}`);
});
