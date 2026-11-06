import type { Request, Router } from 'express';

/** Контекст хука auth-розширення */
export type AuthHookContext = {
  email: string;
  body: Record<string, unknown>;
  req: Request;
  user?: { id: string; email: string; role: string };
  result?: unknown;
};

export type AuthHookName =
  | 'beforeRegister'
  | 'beforeLogin'
  | 'afterRegister'
  | 'afterLogin';

export type AuthHook = (ctx: AuthHookContext) => void | Promise<void>;

/** Розширення модуля auth (captcha, 2FA, …) */
export type AuthExtension = {
  name: string;
  enabled?: boolean;
  routes?: (router: Router) => void;
  beforeRegister?: AuthHook;
  beforeLogin?: AuthHook;
  afterRegister?: AuthHook;
  afterLogin?: AuthHook;
};

export type AuthExtensionModule = {
  extension: AuthExtension;
};
