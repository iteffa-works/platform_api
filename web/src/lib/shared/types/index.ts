/** Рівні прав (дзеркало api/src/core/access) */
export type GrantLevel = 'view' | 'edit' | 'manage';

/** Права ролі: ресурс → рівень; `*` — усі ресурси (розробник) */
export type Permissions = Record<string, GrantLevel>;

export type RoleRef = {
  id: number;
  slug: string;
  name: string;
};

/** Поточний користувач платформи */
export type User = {
  id: number;
  email: string;
  role: RoleRef;
  permissions: Permissions;
};

/** Рядок списку користувачів в адмінці */
export type AdminUser = {
  id: number;
  email: string;
  role: RoleRef;
  createdAt: string;
};

/** Роль у списку адмінки */
export type Role = RoleRef & {
  description: string | null;
  isSystem: boolean;
  permissions: Permissions;
  users: number;
};
