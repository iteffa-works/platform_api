/** Правила хостингу без БД: перевірки вводу, паролі, дати, ціни (чисті функції, покрито тестами) */
import { randomInt } from 'node:crypto';
import { HttpError } from '../../../shared/http/index.js';

/** Дозволені строки оплати, міс. */
export const PERIODS = [1, 3, 6, 12] as const;

/* ---------- Перевірки вводу ---------- */

const LOGIN = /^[a-z][a-z0-9]{2,15}$/;

/** Системні та службові імена, які не можна займати користувачам */
const RESERVED = new Set([
  'root', 'admin', 'administrator', 'adm', 'bin', 'daemon', 'sys', 'sync', 'nobody', 'operator', 'games',
  'www', 'wwwdata', 'web', 'apache', 'nginx', 'httpd', 'mail', 'postfix', 'exim', 'dovecot', 'ftp', 'proftpd',
  'mysql', 'mariadb', 'postgres', 'named', 'bind', 'backup', 'ispmgr', 'ispsystem', 'ispmanager', 'billmgr',
  'support', 'abuse', 'postmaster', 'hostmaster', 'webmaster', 'test', 'user', 'guest', 'system', 'panel',
]);

/** Логін панелі: 3–16 символів, латиниця й цифри, з літери (сумісно з Linux-користувачами панелей) */
export function readLogin(input: unknown): string {
  const login = String(input ?? '').trim().toLowerCase();
  if (!LOGIN.test(login)) throw new HttpError(400, 'Імʼя акаунта: 3–16 символів, латиниця й цифри, з літери');
  if (RESERVED.has(login)) throw new HttpError(400, 'Це імʼя зарезервовано — оберіть інше');
  return login;
}

/** Пароль панелі: 10–64 символи, малі й великі літери та цифри */
export function readPassword(input: unknown): string {
  const password = String(input ?? '');
  if (password.length < 10 || password.length > 64 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, 'Пароль панелі: 10–64 символи, малі й великі літери та цифри');
  }
  return password;
}

const ALPHABET = {
  lower: 'abcdefghijkmnopqrstuvwxyz',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digit: '23456789',
};

/** Надійний пароль (16 символів, усі класи, без схожих 0/O, 1/l) — крипто-ГВЧ */
export function generatePassword(length = 16): string {
  const all = ALPHABET.lower + ALPHABET.upper + ALPHABET.digit;
  const pick = (set: string) => set[randomInt(set.length)]!;
  const chars = [pick(ALPHABET.lower), pick(ALPHABET.upper), pick(ALPHABET.digit)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join('');
}

export function readPeriod(input: unknown): number {
  const months = Number(input);
  if (!PERIODS.includes(months as (typeof PERIODS)[number])) {
    throw new HttpError(400, `Строк оплати: ${PERIODS.join(', ')} міс.`);
  }
  return months;
}

export function readNote(input: unknown): string | null {
  return String(input ?? '').trim().slice(0, 255) || null;
}

/* ---------- Дати ---------- */

/** + місяці; 31 січня + 1 = 28/29 лютого */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const last = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, last));
  return result;
}

const DAY = 24 * 60 * 60 * 1000;

export function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY);
}

/** Доплата за перехід на дорожчий тариф: різниця цін × залишок оплаченого строку (дні / 30); пониження — 0 */
export function upgradeCost(oldPriceCents: number, newPriceCents: number, paidUntil: Date | null, now = new Date()): number {
  if (!paidUntil || newPriceCents <= oldPriceCents) return 0;
  const remaining = Math.max(0, daysBetween(now, paidUntil));
  return Math.ceil(((newPriceCents - oldPriceCents) * remaining) / 30);
}

/* ---------- Ресурси панелі ---------- */

const DOMAIN = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Доменне імʼя (сайт, DNS-зона, пошта): латиниця, IDN — у punycode */
export function readDomain(input: unknown): string {
  const domain = String(input ?? '').trim().toLowerCase().replace(/\.$/, '');
  if (!DOMAIN.test(domain)) throw new HttpError(400, 'Домен: напр. example.com (IDN — у punycode)');
  return domain;
}

/** Імʼя служебного обʼєкта (БД, користувач БД, FTP, локальна частина пошти) */
export function readName(input: unknown, label: string, max = 32): string {
  const name = String(input ?? '').trim().toLowerCase();
  if (!new RegExp(`^[a-z][a-z0-9_.-]{0,${max - 1}}$`).test(name)) {
    throw new HttpError(400, `${label}: до ${max} символів, латиниця, цифри, _ . -, з літери`);
  }
  return name;
}

/** Розклад cron: 5 полів з * / , - і цифр */
export function readSchedule(input: unknown): string {
  const schedule = String(input ?? '').trim().replace(/\s+/g, ' ');
  if (!/^([\d*/,-]+\s){4}[\d*/,-]+$/.test(schedule)) throw new HttpError(400, 'Розклад: 5 полів cron, напр. */15 * * * *');
  return schedule;
}

/** Команда cron: один рядок, без керувальних символів */
export function readCommand(input: unknown): string {
  const command = String(input ?? '').trim();
  if (!command || command.length > 1000 || /[\r\n\0]/.test(command)) throw new HttpError(400, 'Команда: один рядок до 1000 символів');
  return command;
}

export const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'] as const;

export function readDnsType(input: unknown): (typeof DNS_TYPES)[number] {
  const type = String(input ?? '').trim().toUpperCase();
  if (!DNS_TYPES.includes(type as (typeof DNS_TYPES)[number])) throw new HttpError(400, `Тип запису: ${DNS_TYPES.join(', ')}`);
  return type as (typeof DNS_TYPES)[number];
}
