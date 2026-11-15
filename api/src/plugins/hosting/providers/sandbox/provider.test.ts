import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PanelError } from '../contracts.js';
import { SandboxProvider } from './provider.js';
import { SandboxStore } from './store.js';

const URL = 'sandbox://vitest';
const provider = new SandboxProvider();
const connection = { url: URL, username: 'admin', password: 'secret', verifyTls: true };

describe('Sandbox: технічна панель', () => {
  beforeAll(() => SandboxStore.for(URL).reset());
  afterAll(() => SandboxStore.for(URL).reset());

  it('адреса: лише sandbox://<імʼя>', () => {
    expect(provider.normalizeUrl('Sandbox://Demo/')).toBe('sandbox://demo');
    expect(() => provider.normalizeUrl('https://x')).toThrow();
  });

  it('демо-дані й перевірка', async () => {
    const client = provider.connect(connection);
    expect(await client.check()).toEqual({ accounts: 3, packages: 3 });
    expect((await client.sites.list('demo')).map((site) => site.name)).toContain('demo.example');
    expect((await client.system.info()).panel).toBe('Sandbox');
  });

  it('повний цикл користувача: створення ресурсів і каскадне видалення', async () => {
    const client = provider.connect(connection);
    await client.accounts.create({ login: 'vt1', password: 'Pass12345678', package: 'pro', name: 'vt1@example.com' });
    await client.sites.create({ owner: 'vt1', name: 'vt1.example' });
    await client.dns.createZone({ owner: 'vt1', name: 'vt1.example', ip: '203.0.113.10' });
    await client.dns.addRecord('vt1.example', { name: 'www', type: 'CNAME', value: 'vt1.example.' });
    await client.mail.createDomain({ owner: 'vt1', name: 'vt1.example' });
    await client.mail.createBox({ owner: 'vt1', name: 'info', domain: 'vt1.example', password: 'Pass12345678' });
    await client.databases.create({ owner: 'vt1', name: 'vt1_db', user: 'vt1_db', password: 'Pass12345678' });
    await client.ftp.create({ owner: 'vt1', name: 'vt1_ftp', password: 'Pass12345678' });
    await client.cron.create({ owner: 'vt1', command: 'php cron.php', schedule: '*/5 * * * *' });

    expect((await client.dns.records('vt1.example')).map((record) => record.type)).toEqual(['A', 'CNAME']);
    expect((await client.mail.boxes('vt1'))[0]?.address).toBe('info@vt1.example');
    expect(await client.accounts.usage('vt1')).toMatchObject({ sitesUsed: 1, sitesLimit: 10 });

    await client.accounts.remove('vt1');
    for (const list of [client.sites.list('vt1'), client.dns.zones('vt1'), client.mail.boxes('vt1'), client.databases.list('vt1'), client.ftp.list('vt1'), client.cron.list('vt1')]) {
      expect(await list).toEqual([]);
    }
  });

  it('симуляція збоїв: невідомий власник, дубль, «fail», невірний пароль', async () => {
    const client = provider.connect(connection);
    await expect(client.sites.create({ owner: 'ghost', name: 'x.example' })).rejects.toThrow(PanelError);
    await expect(client.sites.create({ owner: 'demo', name: 'demo.example' })).rejects.toThrow('вже існує');
    await expect(client.accounts.create({ login: 'failme', password: 'x', package: null, name: '' })).rejects.toThrow('симульована');
    const wrong = provider.connect({ ...connection, password: 'wrong' });
    await expect(wrong.check()).rejects.toMatchObject({ code: 'auth' });
    await expect(wrong.sites.list()).rejects.toMatchObject({ code: 'auth' });
  });
});
