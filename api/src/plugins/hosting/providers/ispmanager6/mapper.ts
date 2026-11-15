/** Перетворення значень ISPmanager: розміри, прапорці, списки, власник */
import { field, type IspElem } from './transport.js';

/** "1.5 GiB" / "512 MiB" / "2048" (МіБ) → МіБ; не число → null */
export function parseMb(value: string): number | null {
  const match = value.trim().replace(',', '.').match(/^([\d.]+)\s*([KMGT]?)i?B?$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const unit = match[2]!.toUpperCase();
  const factor = unit === 'K' ? 1 / 1024 : unit === 'G' ? 1024 : unit === 'T' ? 1024 * 1024 : 1;
  return Math.round(amount * factor * 100) / 100;
}

/** Розмір з поля (МіБ); порожньо → null; формат «використано / ліміт» — перше число */
export function mb(elem: IspElem, key: string): number | null {
  const raw = field(elem, key);
  return raw ? parseMb(raw.split('/')[0] ?? '') : null;
}

/** Ліміт: порожньо / 0 — без ліміту (null) */
export function limit(elem: IspElem, key: string): number | null {
  const value = mb(elem, key);
  return value && value > 0 ? value : null;
}

export const isOn = (elem: IspElem, key: string): boolean => field(elem, key) === 'on';

/** "a, b c" → ['a', 'b', 'c'] */
export function list(value: string): string[] {
  return value.split(/[\s,]+/).map((item) => item.trim()).filter((item) => item && item !== '-');
}

/**
 * Чи обʼєкт належить користувачу. У режимі `su` панель не віддає колонку owner (список уже обмежено
 * користувачем) — такі рядки належать йому; адміністраторський список — за полем owner / user.
 */
export function ownedBy(elem: IspElem, owner?: string): boolean {
  if (!owner) return true;
  const value = field(elem, 'owner') || field(elem, 'user');
  return !value || value === owner;
}
