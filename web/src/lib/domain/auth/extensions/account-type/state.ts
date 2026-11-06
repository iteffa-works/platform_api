export type AccountKind = 'client' | 'business';

let accountKind: AccountKind = 'client';

export function setAccountKind(value: AccountKind): void {
  accountKind = value;
}

export function getAccountKind(): AccountKind {
  return accountKind;
}
