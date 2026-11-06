/** Користувач платформи */
export type User = {
  id: string;
  email: string;
  role: 'user' | 'admin';
};

/** Telegram-акаунт у кабінеті */
export type Account = {
  id: string;
  label: string;
  apiId: number;
  isActive: boolean;
  createdAt?: string;
};
