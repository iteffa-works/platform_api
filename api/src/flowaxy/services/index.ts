/**
 * Порти — контракти, через які плагіни й розширення користуються функціями інших плагінів, не імпортуючи їх.
 *
 * Плагін реалізує порт і реєструє: `provide('wallet', { … }, 'billing')` (під час завантаження).
 * Інший плагін / розширення бере реалізацію в момент виклику: `use('wallet').charge(…)` — порядок завантаження
 * не важливий. Плагін-власник вимкнено — порт недоступний (503).
 * Разом із хуками (`flowaxy/hooks`) це єдиний спосіб звʼязку плагінів між собою.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Transaction } from 'sequelize';
import type { GrantLevel, Permissions } from '../access/index.js';
import { HttpError } from '../errors.js';
import { isEnabled } from '../plugins/registry.js';

/** Баланс користувача (плагін billing); суми — цілі копійки */
export interface WalletPort {
  balance(userId: number, transaction?: Transaction): Promise<number>;
  /** Списати за послугу в транзакції викликача; не вистачає коштів — HttpError 402 */
  charge(userId: number, cents: number, note: string, transaction: Transaction): Promise<void>;
  refund(userId: number, cents: number, note: string, transaction: Transaction): Promise<void>;
}

/** Публічні дані користувача: імʼя й аватар — для відображення (таблиці, картки) */
export type UserRef = { id: number; email: string; name: string | null; avatarUrl: string | null; createdAt?: Date };

/** Користувачі платформи (плагін auth) — лише публічні поля */
export interface UsersPort {
  byIds(ids: number[]): Promise<Map<number, UserRef>>;
  byEmail(email: string): Promise<UserRef | null>;
  /** Id користувачів, чий email містить текст (пошук у таблицях адмінки) */
  idsByEmailLike(text: string, limit?: number): Promise<number[]>;
}

/** Перевірки доступу для маршрутів (плагін auth) */
export interface AccessPort {
  requireUser: RequestHandler;
  requirePermission(resource: string, level: GrantLevel): RequestHandler;
  /** Права користувача запиту (після requireUser) */
  permissionsOf(req: Request): Promise<Permissions>;
  /** Права за сесією, якщо вона є (гість — null); встановлює req.userId */
  sessionPermissions(req: Request): Promise<Permissions | null>;
}

/** Сповіщення користувачу з подій журналу (плагін notifications) */
export interface NotificationsPort {
  /** `action` події журналу → сповіщення з параметрами `keys` з meta */
  register(action: string, keys?: string[]): void;
}

export interface PlatformPorts {
  wallet: WalletPort;
  users: UsersPort;
  access: AccessPort;
  notifications: NotificationsPort;
}

const registry = new Map<keyof PlatformPorts, { implementation: unknown; owner?: string }>();

/** Зареєструвати реалізацію порту; `owner` — плагін, без якого порт недоступний */
export function provide<K extends keyof PlatformPorts>(name: K, implementation: PlatformPorts[K], owner?: string): void {
  registry.set(name, { implementation, owner });
}

export function use<K extends keyof PlatformPorts>(name: K): PlatformPorts[K] {
  const entry = registry.get(name);
  if (!entry) throw new HttpError(503, `Сервіс «${name}» недоступний`);
  if (entry.owner && !isEnabled(entry.owner)) throw new HttpError(503, `Сервіс «${name}» вимкнено`);
  return entry.implementation as PlatformPorts[K];
}

/**
 * Реалізація порту незалежно від стану власника (null — не зареєстровано).
 * Лише для декларацій, що мають пережити вимкнення плагіна (реєстрація типів сповіщень тощо).
 */
export function registered<K extends keyof PlatformPorts>(name: K): PlatformPorts[K] | null {
  return (registry.get(name)?.implementation as PlatformPorts[K] | undefined) ?? null;
}

/** Чи доступний порт зараз (зареєстровано й власник увімкнений) */
export function available(name: keyof PlatformPorts): boolean {
  const entry = registry.get(name);
  return Boolean(entry && (!entry.owner || isEnabled(entry.owner)));
}

/** Middleware, що бере реалізацію порту доступу під час запиту (маршрути можна створити раніше за auth) */
export const guards = {
  user: (req: Request, res: Response, next: NextFunction) => use('access').requireUser(req, res, next),
  permission: (resource: string, level: GrantLevel) =>
    (req: Request, res: Response, next: NextFunction) => use('access').requirePermission(resource, level)(req, res, next),
};
