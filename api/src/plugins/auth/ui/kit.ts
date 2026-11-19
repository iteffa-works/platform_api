/** Помічники сторінок auth: назва ролі мовою інтерфейсу */
import { tx, type UiContext } from '../../../flowaxy/ui/index.js';

export const roleLabel = (ctx: UiContext, role: { slug: string; name: string }) => tx(ctx, `role.${role.slug}`, role.name);
