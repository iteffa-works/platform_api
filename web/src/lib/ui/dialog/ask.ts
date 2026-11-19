/**
 * Власні вікна замість системних confirm / prompt: у стилі застосунку, з перекладами, поверх модальних вікон.
 * `await askConfirm('Видалити?')` → true / false; `await askPrompt('Примітка', 'текст')` → рядок або null.
 * Хост вікна — <AskHost /> у кореневому layout.
 */
import { writable } from 'svelte/store';

export type AskRequest = {
  kind: 'confirm' | 'prompt';
  message: string;
  title?: string;
  value?: string;
  /** Кнопка підтвердження: danger — для незворотних дій */
  tone?: 'primary' | 'danger';
  confirmLabel?: string;
  multiline?: boolean;
  resolve: (value: string | boolean | null) => void;
};

export const askRequest = writable<AskRequest | null>(null);

type Options = Partial<Pick<AskRequest, 'title' | 'tone' | 'confirmLabel' | 'multiline'>>;

function open(request: Omit<AskRequest, 'resolve'>): Promise<string | boolean | null> {
  return new Promise((resolve) => {
    askRequest.update((previous) => {
      previous?.resolve(previous.kind === 'confirm' ? false : null);
      return { ...request, resolve };
    });
  });
}

/** Підтвердження: true — так, false — скасовано */
export async function askConfirm(message: string, options: Options = {}): Promise<boolean> {
  return (await open({ kind: 'confirm', message, ...options })) === true;
}

/** Значення: рядок або null — скасовано */
export async function askPrompt(message: string, value = '', options: Options = {}): Promise<string | null> {
  const answer = await open({ kind: 'prompt', message, value, ...options });
  return typeof answer === 'string' ? answer : null;
}
