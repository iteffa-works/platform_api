export type User = {
  id: string;
  email: string;
};

export type Account = {
  id: string;
  label: string;
  apiId: number;
  isActive: boolean;
  createdAt?: string;
};

export type CheckItem = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  accountId?: string | null;
};

export type CheckResultRow = {
  id: string;
  query: string;
  kind: string;
  status: string;
  phone: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  telegramUserId: string | null;
  lastSeen: string | null;
  error: string | null;
};

export type CheckDetail = CheckItem & {
  results?: CheckResultRow[];
};
