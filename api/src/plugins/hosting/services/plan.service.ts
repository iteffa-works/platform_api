/** Тарифи хостингу: ціна за місяць (копійки) → шаблон / пакет панелі */
import { HttpError } from '../../../shared/http/index.js';
import { parseAmount } from '../../../shared/money/index.js';
import { optionalCount, optionalText, readText } from '../domain/input.js';
import { HostingAccount, HostingPlan, HostingServer } from '../domain/models.js';
import type { PanelPackage } from '../providers/contracts.js';
import type { MirrorService } from './mirror.service.js';
import { presentPlan } from './presenter.js';

type PlanInput = Partial<Pick<HostingPlan, 'slug' | 'name' | 'description' | 'priceCents' | 'package' | 'diskMb' | 'sites' | 'isActive' | 'isFeatured' | 'sortOrder'>>;

/** Шаблон панелі для тарифів: дані (з першого сервера, де він є) і сервери, де він є */
export type PlanTemplate = { template: PanelPackage; servers: number[] };

export class PlanService {
  constructor(private readonly mirror: MirrorService) {}

  /** Шаблони панелей увімкнених серверів (з копії), за назвою */
  async templates(): Promise<Map<string, PlanTemplate>> {
    const [rows, active] = await Promise.all([
      this.mirror.listAll<PanelPackage>('package'),
      HostingServer.findAll({ where: { isActive: true }, attributes: ['id'] }),
    ]);
    const enabled = new Set(active.map((server) => server.id));
    const result = new Map<string, PlanTemplate>();
    for (const { serverId, data } of rows) {
      if (!enabled.has(serverId)) continue;
      const entry = result.get(data.name);
      if (entry) entry.servers.push(serverId);
      else result.set(data.name, { template: data, servers: [serverId] });
    }
    return result;
  }

  /**
   * Публічна вітрина (головна сторінка): активні тарифи з лімітами їхніх шаблонів панелі
   * і країни серверів, доступних для замовлення. Без внутрішніх полів (шаблон, порядок, id сервера).
   */
  async showcase() {
    const [plans, templates, servers] = await Promise.all([
      this.models(true),
      this.templates(),
      HostingServer.findAll({ where: { isActive: true, isPublic: true }, attributes: ['location'] }),
    ]);
    return {
      plans: plans.map((plan) => {
        const template = templates.get(plan.package)?.template;
        return {
          id: plan.id,
          slug: plan.slug,
          name: plan.name,
          description: plan.description,
          price: presentPlan(plan).price,
          featured: plan.isFeatured,
          diskMb: plan.diskMb,
          sites: plan.sites,
          databases: template?.databases ?? null,
          mailboxes: template?.mailboxes ?? null,
          mailDomains: template?.mailDomains ?? null,
          ftpUsers: template?.ftpUsers ?? null,
          cronJobs: template?.cronJobs ?? null,
          features: template?.features ?? null,
        };
      }),
      locations: [...new Set(servers.map((server) => server.location).filter((code): code is string => Boolean(code)))],
    };
  }

  /**
   * Ліміти вітрини тарифів (диск, сайти) — з їхніх шаблонів панелі: джерело правди — панель.
   * Пише лише змінені тарифи; повертає їх кількість.
   */
  async applyTemplates(templates?: Map<string, PlanTemplate>): Promise<number> {
    const known = templates ?? await this.templates();
    let changed = 0;
    for (const plan of await HostingPlan.findAll()) {
      const template = known.get(plan.package)?.template;
      if (!template) continue;
      const patch: Partial<Pick<HostingPlan, 'diskMb' | 'sites'>> = {};
      const diskMb = template.diskMb === null ? null : Math.round(template.diskMb);
      if (diskMb !== plan.diskMb) patch.diskMb = diskMb;
      if (template.sites !== plan.sites) patch.sites = template.sites;
      if (!Object.keys(patch).length) continue;
      await plan.update(patch);
      changed += 1;
    }
    return changed;
  }

  async find(id: number, activeOnly = false): Promise<HostingPlan> {
    const plan = await HostingPlan.findOne({ where: activeOnly ? { id, isActive: true } : { id } });
    if (!plan) throw new HttpError(404, 'Тариф не знайдено');
    return plan;
  }

  async models(activeOnly = false): Promise<HostingPlan[]> {
    return HostingPlan.findAll({ where: activeOnly ? { isActive: true } : {}, order: [['sortOrder', 'ASC'], ['priceCents', 'ASC']] });
  }

  async list(activeOnly = false) {
    return (await this.models(activeOnly)).map(presentPlan);
  }

  private read(input: Record<string, unknown>, partial: boolean): PlanInput {
    const plan: PlanInput = {};
    if (!partial || input.slug !== undefined) {
      const slug = String(input.slug ?? '').trim();
      if (!/^[a-z][a-z0-9-]{1,31}$/.test(slug)) throw new HttpError(400, 'Ключ тарифу: 2–32 символи, латиниця, цифри, дефіс');
      plan.slug = slug;
    }
    if (!partial || input.name !== undefined) plan.name = readText(input.name, 'Назва тарифу', 80);
    if (input.description !== undefined) plan.description = optionalText(input.description, 255);
    if (!partial || input.price !== undefined) {
      const cents = parseAmount(input.price);
      // 0 — безкоштовний тариф (Free)
      if (cents === null || cents < 0) throw new HttpError(400, 'Ціна за місяць: число ≥ 0, до 2 знаків після коми');
      plan.priceCents = cents;
    }
    if (!partial || input.package !== undefined) plan.package = readText(input.package, 'Шаблон панелі', 64);
    if (input.diskMb !== undefined) plan.diskMb = optionalCount(input.diskMb, 'Диск, МБ');
    if (input.sites !== undefined) plan.sites = optionalCount(input.sites, 'Сайтів');
    if (input.isActive !== undefined) plan.isActive = Boolean(input.isActive);
    if (input.isFeatured !== undefined) plan.isFeatured = Boolean(input.isFeatured);
    if (input.sortOrder !== undefined) plan.sortOrder = Math.trunc(Number(input.sortOrder)) || 0;
    return plan;
  }

  private async ensureSlugFree(slug: string | undefined, exceptId?: number): Promise<void> {
    if (!slug) return;
    const existing = await HostingPlan.findOne({ where: { slug } });
    if (existing && existing.id !== exceptId) throw new HttpError(409, 'Тариф з таким ключем уже існує');
  }

  async create(input: Record<string, unknown>) {
    const data = this.read(input, false);
    await this.ensureSlugFree(data.slug);
    return { plan: presentPlan(await HostingPlan.create(data as Required<Pick<PlanInput, 'slug' | 'name' | 'priceCents' | 'package'>> & PlanInput)) };
  }

  /** Зміна ціни діє з наступного продовження; шаблон — для нових замовлень і змін тарифу */
  async update(id: number, input: Record<string, unknown>) {
    const plan = await this.find(id);
    const data = this.read(input, true);
    await this.ensureSlugFree(data.slug, id);
    await plan.update(data);
    return { plan: presentPlan(plan) };
  }

  async remove(id: number) {
    const plan = await this.find(id);
    if (await HostingAccount.count({ where: { planId: id } })) throw new HttpError(400, 'Тариф використовується — вимкніть його замість видалення');
    await plan.destroy();
  }
}
