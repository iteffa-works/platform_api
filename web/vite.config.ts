import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Dev за Nginx Open Server: https://sandbox.local → :5173
export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    origin: 'https://sandbox.local',
    allowedHosts: ['sandbox.local', 'www.sandbox.local'],
    hmr: { host: 'sandbox.local', protocol: 'wss', clientPort: 443 },
    proxy: { '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true } },
  },
});
