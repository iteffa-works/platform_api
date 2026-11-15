import { describe, expect, it } from 'vitest';
import { field, IspError, normalize, parseResponse, toArray } from './client.js';
import { normalizeUrl } from './url.js';

describe('ISPmanager: відповідь панелі', () => {
  it('нормалізує значення й атрибути', () => {
    expect(normalize({ name: { $: 'site.com' }, $id: '7', nested: [{ $: 'a' }] })).toEqual({ name: 'site.com', id: '7', nested: ['a'] });
  });

  it('elem — завжди масив', () => {
    expect(toArray(undefined)).toEqual([]);
    expect(toArray({ name: 'one' })).toEqual([{ name: 'one' }]);
    expect(toArray([1, 2])).toEqual([1, 2]);
  });

  it('читає поле як рядок', () => {
    expect(field({ active: 'on', count: 3 }, 'active')).toBe('on');
    expect(field({ count: 3 }, 'count')).toBe('3');
    expect(field({}, 'missing')).toBe('');
  });

  it('повертає doc і кидає помилку панелі', () => {
    expect(parseResponse('{"doc":{"auth":{"$id":"abc","$":"abc"}}}')).toEqual({ auth: { id: 'abc', $: 'abc' } });
    expect(() => parseResponse('{"doc":{"error":{"$type":"auth","msg":{"$":"Invalid username or password"}}}}'))
      .toThrowError(new IspError('Invalid username or password', 'auth'));
    expect(() => parseResponse('<html>')).toThrow(IspError);
  });
});

describe('ISPmanager: адреса панелі', () => {
  it('прибирає /ispmgr і кінцеві слеші', () => {
    expect(normalizeUrl('https://host.example.com:1500/ispmgr/')).toBe('https://host.example.com:1500');
    expect(normalizeUrl('https://host:1500/')).toBe('https://host:1500');
  });

  it('відхиляє інші схеми й облікові дані в URL', () => {
    expect(() => normalizeUrl('ftp://host')).toThrow();
    expect(() => normalizeUrl('https://root:pw@host:1500')).toThrow();
    expect(() => normalizeUrl('not a url')).toThrow();
  });
});
