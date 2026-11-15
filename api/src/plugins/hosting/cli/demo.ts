/**
 * Демо-дані хостингу на технічних панелях Sandbox (ідемпотентно — повторний запуск нічого не дублює):
 * - сервери «Sandbox Україна» (sandbox://ua) і «Sandbox Німеччина» (sandbox://de) — доступні для замовлення;
 * - тарифи Старт / Швидкий / Кращий (шаблони панелі basic / pro / business);
 * - акаунти користувача: активний, що закінчується, заблокований за несплату.
 *
 * npm run hosting:demo -w api [-- <email>]   (без email — перший developer)
 */
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../core/db/sequelize.js';
import { User } from '../../../modules/auth/models/user.js';
import { HostingAccount, HostingPlan, HostingServer } from '../domain/models.js';
import { addDays } from '../domain/rules.js';
import { hosting } from '../module.js';

const SERVERS = [
  { name: 'Sandbox Україна', url: 'sandbox://ua', location: 'UA', ipv4: '203.0.113.10, 203.0.113.11', ipv6: '2001:db8:10::1' },
  { name: 'Sandbox Німеччина', url: 'sandbox://de', location: 'DE', ipv4: '198.51.100.20', ipv6: '2001:db8:20::1' },
];

const PLANS = [
  { slug: 'start', name: 'Старт', price: '79', package: 'basic', diskMb: '5120', sites: '3', description: 'Лендинг або блог', sortOrder: 1 },
  { slug: 'fast', name: 'Швидкий', price: '149', package: 'pro', diskMb: '20480', sites: '10', description: 'Інтернет-магазин, кілька сайтів', sortOrder: 2 },
  { slug: 'best', name: 'Кращий', price: '299', package: 'business', diskMb: '51200', sites: '', description: 'Без ліміту сайтів, пріоритетні ресурси', sortOrder: 3 },
];

/** Користувачі, що вже є в демо-даних Sandbox (store.ts) → акаунти платформи */
const ACCOUNTS = [
  { server: 'sandbox://ua', login: 'demo', plan: 'best', paidDays: 43, status: 'active' as const, note: 'Основний сайт' },
  { server: 'sandbox://de', login: 'shop', plan: 'fast', paidDays: 3, status: 'active' as const, note: null },
  { server: 'sandbox://ua', login: 'archive', plan: 'fast', paidDays: -22, status: 'suspended' as const, note: 'Старий проєкт' },
];

async function findUser(email?: string): Promise<User> {
  if (email) {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new Error(`Користувача ${email} не знайдено`);
    return user;
  }
  const [row] = await sequelize.query<{ id: number }>(
    "SELECT u.id FROM users u JOIN roles r ON r.id = u.roleId WHERE r.slug = 'developer' ORDER BY u.id LIMIT 1",
    { type: QueryTypes.SELECT },
  );
  if (!row) throw new Error('Немає користувача developer — вкажіть email');
  return (await User.findByPk(row.id))!;
}

try {
  const user = await findUser(process.argv[2]);
  const log: string[] = [];

  const servers = new Map<string, HostingServer>();
  for (const item of SERVERS) {
    let server = await HostingServer.findOne({ where: { url: item.url } });
    if (!server) {
      await hosting.servers.create({ provider: 'sandbox', username: 'admin', password: 'sandbox', verifyTls: true, isPublic: true, ...item });
      server = (await HostingServer.findOne({ where: { url: item.url } }))!;
      log.push(`сервер ${item.name}`);
    }
    servers.set(item.url, server);
  }

  const plans = new Map<string, HostingPlan>();
  for (const item of PLANS) {
    let plan = await HostingPlan.findOne({ where: { slug: item.slug } });
    if (!plan) {
      await hosting.plans.create(item);
      plan = (await HostingPlan.findOne({ where: { slug: item.slug } }))!;
      log.push(`тариф ${item.name}`);
    }
    plans.set(item.slug, plan);
  }

  for (const item of ACCOUNTS) {
    const server = servers.get(item.server)!;
    const exists = await HostingAccount.findOne({ where: { serverId: server.id, panelUser: item.login, status: ['active', 'suspended', 'pending'] } });
    if (exists) continue;
    const plan = plans.get(item.plan)!;
    const account = await HostingAccount.create({
      serverId: server.id,
      userId: user.id,
      planId: plan.id,
      panelUser: item.login,
      preset: plan.package,
      status: item.status,
      suspendReason: item.status === 'suspended' ? 'billing' : null,
      paidUntil: addDays(new Date(), item.paidDays),
      note: item.note,
    });
    // Панель: стан користувача відповідає акаунту (archive у демо-даних уже заблокований)
    const panel = hosting.servers.client(server).accounts;
    await panel.setPackage(item.login, plan.package).catch(() => undefined);
    if (item.status === 'active') await panel.resume(item.login).catch(() => undefined);
    await hosting.accounts.refreshUsage(await hosting.accounts.find(account.id)).catch(() => undefined);
    log.push(`акаунт ${item.login} (${plan.name}, ${item.status})`);
  }

  console.log(log.length ? `Створено: ${log.join(', ')}` : 'Демо-дані вже є — нічого не змінено');
  console.log(`Користувач: ${user.email}. Кабінет: /app/hosting · Адмінка: /admin/hosting`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
