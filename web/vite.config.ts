import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/** Міксини й функції Sass (без CSS на виході) — доступні в кожному `<style lang="scss">` без імпорту */
const SCSS_TOOLS = fileURLToPath(new URL('./src/lib/ui/styles/tools', import.meta.url)).replace(/\\/g, '/');

// Dev за Nginx Open Server: https://sandbox.local → :5173
export default defineConfig({
  plugins: [sveltekit()],
  css: {
    preprocessorOptions: {
      scss: {
        // Самі файли tools не підключають себе
        additionalData: (source: string, file: string) =>
          file.replace(/\\/g, '/').startsWith(SCSS_TOOLS) ? source : `@use '${SCSS_TOOLS}' as *;\n${source}`,
      },
    },
  },
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
