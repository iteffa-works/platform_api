/** Тарифи хостингу: ціна за місяць (копійки) → шаблон / пакет панелі */
import { parseAmount } from '../../../modules/billing/money.js';
import { HttpError } from '../../../shared/http/index.js';
import { HostingAccount, HostingPlan } from '../domain/models.js';
import { presentPlan } from './presenter.js';

type PlanInput = Partial<Pick<HostingPlan, 'slug' | 'name' | 'description' | 'priceCents' | 'package' | 'diskMb' | 'sites' | 'isActive' | 'sortOrder'>>;

function optionalCount(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === '') return null;
  const count = Math.trunc(Number(value));
  if (!Number.isFinite(count) || count < 0) throw new HttpError(400, `${label}: ціле число ≥ 0 або порожньо`);
  return count;
}

export class PlanService {
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
    if (!partial || input.name !== undefined) {
      const name = String(input.name ?? '').trim();
      if (!name || name.length > 80) throw new HttpError(400, 'Назва тарифу: 1–80 символів');
      plan.name = name;
    }
    if (input.description !== undefined) plan.description = String(input.description ?? '').trim().slice(0, 255) || null;
    if (!partial || input.price !== undefined) {
      const cents = parseAmount(input.price);
      if (cents === null || cents <= 0) throw new HttpError(400, 'Ціна за місяць: число > 0, до 2 знаків після коми');
      plan.priceCents = cents;
    }
    if (!partial || input.package !== undefined) {
      const pkg = String(input.package ?? '').trim();
      if (!pkg || pkg.length > 64) throw new HttpError(400, 'Шаблон панелі: 1–64 символи');
      plan.package = pkg;
    }
    if (input.diskMb !== undefined) plan.diskMb = optionalCount(input.diskMb, 'Диск, МБ');
    if (input.sites !== undefined) plan.sites = optionalCount(input.sites, 'Сайтів');
    if (input.isActive !== undefined) plan.isActive = Boolean(input.isActive);
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
