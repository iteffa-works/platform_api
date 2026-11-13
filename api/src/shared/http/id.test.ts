import { describe, expect, it } from 'vitest';
import { parseId } from './id.js';

describe('parseId', () => {
  it('приймає додатні цілі з URL і JSON', () => {
    expect(parseId('42')).toBe(42);
    expect(parseId(7)).toBe(7);
  });

  it('відхиляє некоректні', () => {
    for (const value of ['0', '-1', '1.5', 'abc', '', ' 1', '1e3', 0, -3, 1.5, null, undefined, '9007199254740993']) {
      expect(parseId(value)).toBeNull();
    }
  });
});
