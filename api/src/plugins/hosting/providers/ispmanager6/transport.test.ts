import { describe, expect, it } from 'vitest';
import { PanelError } from '../contracts.js';
import { field, normalize, parseResponse, toArray } from './transport.js';
import { normalizeHttpUrl } from '../../domain/url.js';

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
      .toThrowError(new PanelError('Invalid username or password', 'auth'));
    expect(() => parseResponse('<html>')).toThrow(PanelError);
  });
});

describe('ISPmanager: адреса панелі', () => {
  it('прибирає /ispmgr і кінцеві слеші', () => {
    expect(normalizeHttpUrl('https://host.example.com:1500/ispmgr/', '/ispmgr')).toBe('https://host.example.com:1500');
    expect(normalizeHttpUrl('https://host:1500/')).toBe('https://host:1500');
  });

  it('відхиляє інші схеми й облікові дані в URL', () => {
    expect(() => normalizeHttpUrl('ftp://host')).toThrow();
    expect(() => normalizeHttpUrl('https://root:pw@host:1500')).toThrow();
    expect(() => normalizeHttpUrl('not a url')).toThrow();
  });
});

describe('ISPmanager: варіанти форми й власник', () => {
  it('перший варіант slist', async () => {
    const { firstOption } = await import('./transport.js');
    const doc = parseResponse('{"doc":{"slist":[{"$name":"ipsrc","val":[{"$key":"185.25.119.251","$":"185.25.119.251"},{"$key":"10.0.0.1"}]}]}}');
    expect(firstOption(doc, 'ipsrc')).toBe('185.25.119.251');
    expect(firstOption(doc, 'missing')).toBeNull();
  });

  it('su-рядки без колонки owner належать користувачу', async () => {
    const { ownedBy } = await import('./mapper.js');
    expect(ownedBy({ name: 'a' }, 'ukrtp')).toBe(true);
    expect(ownedBy({ owner: 'www-root' }, 'ukrtp')).toBe(false);
    expect(ownedBy({ owner: 'ukrtp' }, 'ukrtp')).toBe(true);
  });
});
