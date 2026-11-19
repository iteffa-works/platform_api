import { describe, expect, it } from 'vitest';
import { can, effectiveLevel, isWithin, parsePermissions, type PermissionCatalog } from './index.js';

const catalog: PermissionCatalog = {
  users: { label: 'Користувачі', levels: ['view', 'manage'] },
  roles: { label: 'Ролі', levels: ['view', 'manage'] },
  'admin.panel': { label: 'Адмінка', levels: ['view'] },
};

describe('can', () => {
  it('порівнює рівні', () => {
    const perms = { users: 'edit' } as const;
    expect(can(perms, 'users', 'view')).toBe(true);
    expect(can(perms, 'users', 'edit')).toBe(true);
    expect(can(perms, 'users', 'manage')).toBe(false);
  });

  it('відсутній ресурс = none', () => {
    expect(can({}, 'users', 'view')).toBe(false);
  });

  it('* дає усе, включно з майбутніми ресурсами', () => {
    expect(can({ '*': 'manage' }, 'not-yet-declared', 'manage')).toBe(true);
  });
});

describe('isWithin', () => {
  const actor = { users: 'manage', roles: 'view' } as const;

  it('дозволяє видати рівні не вищі за власні', () => {
    expect(isWithin({ users: 'view' }, actor)).toBe(true);
    expect(isWithin({ users: 'manage', roles: 'view' }, actor)).toBe(true);
  });

  it('забороняє ескалацію', () => {
    expect(isWithin({ roles: 'manage' }, actor)).toBe(false);
    expect(isWithin({ settings: 'view' }, actor)).toBe(false);
  });

  it('* видати може лише власник *', () => {
    expect(isWithin({ '*': 'manage' }, actor)).toBe(false);
    expect(isWithin({ '*': 'manage' }, { '*': 'manage' })).toBe(true);
  });
});

describe('parsePermissions', () => {
  it('приймає рівні з каталогу і відкидає none', () => {
    expect(parsePermissions({ users: 'manage', roles: 'none' }, catalog)).toEqual({ users: 'manage' });
  });

  it('відхиляє невідомий ресурс', () => {
    expect(() => parsePermissions({ '*': 'manage' }, catalog)).toThrow(/Невідомий ресурс/);
  });

  it('відхиляє рівень, недоступний ресурсу', () => {
    expect(() => parsePermissions({ 'admin.panel': 'manage' }, catalog)).toThrow(/недоступний/);
    expect(() => parsePermissions({ users: 'edit' }, catalog)).toThrow(/недоступний/);
  });

  it('відхиляє не-обʼєкт', () => {
    expect(() => parsePermissions(['users'], catalog)).toThrow(TypeError);
  });
});

describe('effectiveLevel', () => {
  it('повертає найвищий доступний рівень ресурсу', () => {
    expect(effectiveLevel({ users: 'manage' }, 'users', ['view', 'manage'])).toBe('manage');
    expect(effectiveLevel({ users: 'edit' }, 'users', ['view', 'manage'])).toBe('view');
    expect(effectiveLevel({}, 'users', ['view', 'manage'])).toBeUndefined();
    expect(effectiveLevel({ '*': 'manage' }, 'roles', ['view'])).toBe('view');
  });
});
