/** Розбір вводу форм адмінки й кабінету — спільні перевірки (сервіси не повторюють їх кожен по-своєму) */
import { isIP } from 'node:net';
import { HttpError } from '../../../shared/http/index.js';

/** Обовʼязковий рядок довжиною 1–max */
export function readText(input: unknown, label: string, max: number): string {
  const text = String(input ?? '').trim();
  if (!text || text.length > max) throw new HttpError(400, `${label}: 1–${max} символів`);
  return text;
}

/** Необовʼязковий рядок: порожньо — null, довше max — обрізати */
export function optionalText(input: unknown, max: number): string | null {
  return String(input ?? '').trim().slice(0, max) || null;
}

/** Ціле ≥ min або null (порожньо) */
export function optionalCount(input: unknown, label: string, min = 0): number | null {
  if (input === null || input === undefined || input === '') return null;
  const count = Math.trunc(Number(input));
  if (!Number.isFinite(count) || count < min) throw new HttpError(400, `${label}: ціле число ≥ ${min} або порожньо`);
  return count;
}

/** Дата або null (порожньо) */
export function readDate(input: unknown): Date | null {
  if (input === null || input === '' || input === undefined) return null;
  const date = new Date(String(input));
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Некоректна дата');
  return date;
}

/** Код країни ISO 3166-1 alpha-2 або null */
export function readCountry(input: unknown): string | null {
  const code = String(input ?? '').trim().toUpperCase();
  if (code && !/^[A-Z]{2}$/.test(code)) throw new HttpError(400, 'Країна: код ISO з 2 літер (UA, DE, …)');
  return code || null;
}

/** Список IP однієї родини через кому / пробіл → «a, b» або null */
export function readIps(input: unknown, family: 4 | 6): string | null {
  const list = String(input ?? '').split(/[\s,]+/).filter(Boolean);
  for (const ip of list) {
    if (isIP(ip) !== family) throw new HttpError(400, `Некоректна IPv${family}-адреса: ${ip.slice(0, 45)}`);
  }
  return list.length ? list.slice(0, 8).join(', ') : null;
}

/** «a, b» ↔ масив */
export function splitIps(value: string | null): string[] {
  return (value ?? '').split(/[\s,]+/).filter(Boolean);
}

/** Приватні й службові адреси (NAT, loopback, link-local, CGNAT) — не для DNS-записів клієнтів */
export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a = 0, b = 0] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const low = ip.toLowerCase();
  return low === '::1' || low === '::' || low.startsWith('fe80:') || /^f[cd]/.test(low);
}

/** IP з панелі → поля сервера за родиною, лише публічні (null — немає адрес цієї родини) */
export function ipsByFamily(ips: string[]): { ipv4: string | null; ipv6: string | null } {
  const join = (family: 4 | 6) => ips.filter((ip) => isIP(ip) === family && !isPrivateIp(ip)).slice(0, 8).join(', ') || null;
  return { ipv4: join(4), ipv6: join(6) };
}
