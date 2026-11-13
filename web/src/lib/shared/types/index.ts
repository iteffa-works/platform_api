/** Рівні прав (дзеркало api/src/core/access) */
export type GrantLevel = 'view' | 'edit' | 'manage';

/** Права ролі: ресурс → рівень; `*` — усі ресурси (розробник) */
export type Permissions = Record<string, GrantLevel>;

export type RoleRef = {
  id: number;
  slug: string;
  name: string;
};

/** Налаштування акаунта; null — ще не обрано */
export type Preferences = {
  theme: 'light' | 'dark' | null;
  /** IANA-пояс показу дат; null — пояс браузера */
  timezone: string | null;
};

/** Поточний користувач платформи */
export type User = {
  id: number;
  email: string;
  name: string | null;
  role: RoleRef;
  permissions: Permissions;
  preferences: Preferences;
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
