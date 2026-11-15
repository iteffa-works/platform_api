import { describe, expect, it } from 'vitest';
import { base32Decode, base32Encode, generateSecret, totp, verifyTotp } from './totp.js';

// RFC 6238, додаток B: секрет "12345678901234567890" (SHA1), 8 цифр
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('totp', () => {
  it('base32 туди й назад', () => {
    expect(RFC_SECRET).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(base32Decode(RFC_SECRET).toString()).toBe('12345678901234567890');
  });

  it('еталонні значення RFC 6238', () => {
    expect(totp(RFC_SECRET, 59_000, { digits: 8 })).toBe('94287082');
    expect(totp(RFC_SECRET, 1_111_111_109_000, { digits: 8 })).toBe('07081804');
    expect(totp(RFC_SECRET, 2_000_000_000_000, { digits: 8 })).toBe('69279037');
  });

  it('перевірка з допуском одного кроку', () => {
    const secret = generateSecret();
    const now = 1_700_000_000_000;
    expect(verifyTotp(secret, totp(secret, now), { time: now })).toBe(true);
    expect(verifyTotp(secret, totp(secret, now - 30_000), { time: now })).toBe(true);
    expect(verifyTotp(secret, totp(secret, now - 90_000), { time: now })).toBe(false);
    expect(verifyTotp(secret, 'abcdef', { time: now })).toBe(false);
  });
});
