export type VerificationMethod = 'email' | 'phone' | 'invite';

let verificationMethod: VerificationMethod = 'email';
let inviteCode = '';

export function setVerificationMethod(value: VerificationMethod): void {
  verificationMethod = value;
}

export function getVerificationMethod(): VerificationMethod {
  return verificationMethod;
}

export function setInviteCode(value: string): void {
  inviteCode = value;
}

export function getInviteCode(): string {
  return inviteCode;
}
