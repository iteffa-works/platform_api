/** Виконання дій схеми: REST-виклик `/api/v1<url>` з підтвердженням / запитом значення / відкриттям вкладки */
import { writable } from 'svelte/store';
import { api } from '$lib/core/api';
import { askConfirm, askPrompt } from '$lib/ui/dialog/ask';
import type { UiAction } from './schema.js';

export type Values = Record<string, string | boolean>;

/** `{ключ}` / `{a.b}` — значення з відповіді API */
export function interpolate(template: string, data: unknown): string {
  return template.replace(/\{([\w.]+)\}/g, (match, path: string) => {
    const value = path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), data);
    return value === undefined || value === null ? match : String(value);
  });
}

/** Результат для показу (пароль один раз, діагностика) — переживає redirect */
export type ShownResult = { title: string; text?: string; format: 'secret' | 'json'; value: string };
export const pendingResult = writable<ShownResult | null>(null);

/** null — користувач скасував (confirm / prompt) */
export async function callAction(action: UiAction, values: Values = {}): Promise<{ response: unknown } | null> {
  // Видалення — червона кнопка підтвердження
  if (action.confirm && !(await askConfirm(action.confirm, { tone: action.method === 'DELETE' ? 'danger' : 'primary' }))) return null;

  const body: Record<string, unknown> = { ...(action.body ?? {}), ...values };
  if (action.prompt) {
    const answer = await askPrompt(action.prompt.message, action.prompt.value ?? '');
    if (answer === null) return null;
    body[action.prompt.field] = answer;
  }

  // Вікно — до запиту: після await браузер блокує спливаюче вікно
  const tab = action.openUrl ? window.open('about:blank', '_blank') : null;
  try {
    const response = await api<unknown>(action.url, { method: action.method, body: action.method === 'GET' ? undefined : body });
    if (action.openUrl) {
      const url = (response as Record<string, unknown> | null)?.[action.openUrl];
      if (typeof url === 'string' && /^https?:\/\//.test(url)) {
        if (tab) tab.location.href = url;
        else window.location.href = url;
      } else {
        tab?.close();
      }
    }
    return { response };
  } catch (error) {
    tab?.close();
    throw error;
  }
}
