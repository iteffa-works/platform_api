import { describe, expect, it } from 'vitest';
import { ipsByFamily } from '../domain/input.js';
import { hashOf } from './mirror.service.js';

describe('hashOf', () => {
  it('не залежить від порядку ключів (MySQL JSON сортує ключі)', () => {
    expect(hashOf({ name: 'a.com', owner: 'demo', ips: ['1.1.1.1'] })).toBe(hashOf({ ips: ['1.1.1.1'], owner: 'demo', name: 'a.com' }));
  });

  it('розрізняє зміну значення й порядку масиву', () => {
    const base = hashOf({ ips: ['1.1.1.1', '2.2.2.2'] });
    expect(hashOf({ ips: ['2.2.2.2', '1.1.1.1'] })).not.toBe(base);
    expect(hashOf({ ips: ['1.1.1.1'] })).not.toBe(base);
  });

  it('null і відсутнє поле — різні дані', () => {
    expect(hashOf({ php: null })).not.toBe(hashOf({}));
  });
});

describe('ipsByFamily', () => {
  it('розкладає адреси панелі за родиною', () => {
    expect(ipsByFamily(['203.0.113.10', '2001:db8::1', '203.0.113.11', 'bad'])).toEqual({ ipv4: '203.0.113.10, 203.0.113.11', ipv6: '2001:db8::1' });
  });

  it('приватні й службові адреси (NAT) пропускає', () => {
    expect(ipsByFamily(['10.0.0.5', '192.168.1.2', '172.20.0.1', '127.0.0.1', 'fe80::1', 'fd00::2', '198.51.100.20'])).toEqual({ ipv4: '198.51.100.20', ipv6: null });
  });

  it('без адрес родини — null (поле сервера не перезаписується)', () => {
    expect(ipsByFamily(['203.0.113.10'])).toEqual({ ipv4: '203.0.113.10', ipv6: null });
  });
});
