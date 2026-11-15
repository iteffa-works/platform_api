import { describe, expect, it } from 'vitest';
import { formatAmount, parseAmount } from './money.js';

describe('money', () => {
  it('рядок → копійки', () => {
    expect(parseAmount('12.5')).toBe(1250);
    expect(parseAmount('12,05')).toBe(1205);
    expect(parseAmount(100)).toBe(10000);
    expect(parseAmount('-3.10')).toBe(-310);
    expect(parseAmount('0.01')).toBe(1);
  });

  it('відхиляє некоректне', () => {
    for (const value of ['', 'abc', '1.234', '1e3', null, '--1', '1.']) expect(parseAmount(value)).toBeNull();
  });

  it('копійки → рядок', () => {
    expect(formatAmount(1250)).toBe('12.50');
    expect(formatAmount(-5)).toBe('-0.05');
    expect(formatAmount(0)).toBe('0.00');
  });
});
