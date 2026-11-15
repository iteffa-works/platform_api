import { describe, expect, it } from 'vitest';
import { addMonths, generatePassword, readCommand, readDnsType, readDomain, readLogin, readName, readPassword, readPeriod, readSchedule, upgradeCost } from './rules.js';
import { parseMb } from '../providers/ispmanager6/mapper.js';

describe('хостинг: правила', () => {
  it('логін: формат і зарезервовані імена', () => {
    expect(readLogin(' Flowaxy ')).toBe('flowaxy');
    expect(() => readLogin('ab')).toThrow();
    expect(() => readLogin('1abc')).toThrow();
    expect(() => readLogin('a-b_c')).toThrow();
    expect(() => readLogin('root')).toThrow();
    expect(() => readLogin('admin')).toThrow();
  });

  it('пароль: довжина й класи символів', () => {
    expect(readPassword('Abcdefgh12')).toBe('Abcdefgh12');
    expect(() => readPassword('abcdefgh12')).toThrow();
    expect(() => readPassword('Abc12')).toThrow();
  });

  it('згенерований пароль проходить власну перевірку й різний щоразу', () => {
    const passwords = new Set(Array.from({ length: 50 }, () => generatePassword()));
    expect(passwords.size).toBe(50);
    for (const password of passwords) expect(readPassword(password)).toBe(password);
  });

  it('строки оплати', () => {
    expect(readPeriod(12)).toBe(12);
    expect(() => readPeriod(2)).toThrow();
  });

  it('+ місяці з урахуванням кінця місяця', () => {
    expect(addMonths(new Date(2026, 0, 31), 1).getDate()).toBe(28);
    expect(addMonths(new Date(2026, 10, 15), 3).getMonth()).toBe(1);
  });

  it('доплата за перехід на дорожчий тариф — пропорційно залишку', () => {
    const now = new Date(2026, 10, 1);
    const paidUntil = new Date(2026, 10, 16); // 15 днів
    expect(upgradeCost(10000, 16000, paidUntil, now)).toBe(3000);
    expect(upgradeCost(16000, 10000, paidUntil, now)).toBe(0);
    expect(upgradeCost(10000, 16000, null, now)).toBe(0);
  });
});

describe('ISPmanager: розмір', () => {
  it('МіБ з різних форматів', () => {
    expect(parseMb('2048')).toBe(2048);
    expect(parseMb('1.5 GiB')).toBe(1536);
    expect(parseMb('512 MiB')).toBe(512);
    expect(parseMb('unlimited')).toBeNull();
  });
});

describe('хостинг: ресурси панелі', () => {
  it('домени', () => {
    expect(readDomain('Example.COM.')).toBe('example.com');
    expect(readDomain('xn--80ak6aa92e.com')).toBe('xn--80ak6aa92e.com');
    expect(() => readDomain('localhost')).toThrow();
    expect(() => readDomain('bad_domain.com')).toThrow();
    expect(() => readDomain('-x.com')).toThrow();
  });

  it('імена обʼєктів', () => {
    expect(readName('Shop_DB', 'БД')).toBe('shop_db');
    expect(() => readName('1db', 'БД')).toThrow();
    expect(() => readName('a; rm -rf', 'БД')).toThrow();
  });

  it('cron: розклад і команда', () => {
    expect(readSchedule('*/15  * * * *')).toBe('*/15 * * * *');
    expect(() => readSchedule('* * *')).toThrow();
    expect(() => readSchedule('@reboot')).toThrow();
    expect(readCommand(' php cron.php ')).toBe('php cron.php');
    expect(() => readCommand('a\nb')).toThrow();
  });

  it('типи DNS-записів', () => {
    expect(readDnsType('mx')).toBe('MX');
    expect(() => readDnsType('PTR')).toThrow();
  });
});
