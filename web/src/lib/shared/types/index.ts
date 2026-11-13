/** Користувач платформи */
export type User = {
  id: string;
  email: string;
  role: 'user' | 'admin';
};
