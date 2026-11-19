/**
 * PM2: два процеси — API (Express) і web (SvelteKit). Перед стартом: `npm ci && npm run build`.
 * Змінні — з api/.env і web/.env (див. *.env.example). Запуск: `pm2 start ecosystem.config.cjs && pm2 save`.
 * Інструкція — docs/DEPLOY.md.
 */
module.exports = {
  apps: [
    {
      name: 'flowaxy-api',
      cwd: './api',
      script: 'dist/index.js',
      node_args: '--env-file=.env',
      env: { NODE_ENV: 'production' },
      instances: 1, // фонове завдання хостингу розраховане на один процес
      max_memory_restart: '512M',
      kill_timeout: 12000, // API закриває запити й пул БД за ≤ 10 с
      time: true,
    },
    {
      name: 'flowaxy-web',
      cwd: './web',
      script: 'build/index.js',
      node_args: '--env-file=.env',
      env: { NODE_ENV: 'production' },
      instances: 1,
      max_memory_restart: '384M',
      time: true,
    },
  ],
};
