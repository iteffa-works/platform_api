/** Розташування розширень і плагінів застосунку — передається ядру Flowaxy (`configure`) */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configure } from './flowaxy/settings.js';

const root = path.dirname(fileURLToPath(import.meta.url));

configure({
  extensionsDir: path.join(root, 'extensions'),
  pluginsDir: path.join(root, 'plugins'),
});
