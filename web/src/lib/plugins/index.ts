/**
 * Підключені web-плагіни. Новий плагін = тека в plugins/ + рядок тут.
 * Сторінки, блоки й навігацію плагіна збирає $lib/constructor/registry.
 */
import type { WebPlugin } from '$lib/constructor/types';
import { admin } from './admin/index.js';
import { auth } from './auth/index.js';
import { cabinet } from './cabinet/index.js';
import { site } from './site/index.js';

export const plugins: WebPlugin[] = [site, auth, cabinet, admin];
