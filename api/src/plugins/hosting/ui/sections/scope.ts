/**
 * Область розділів панелі (сайти, DNS, пошта, БД, FTP, SSL, cron) — одні й ті самі розділи для:
 * - консолі адміністратора: усі власники, фільтр `?owner=`, REST `/admin/hosting/servers/:id/panel`;
 * - кабінету клієнта: власник зафіксований (логін його акаунта), REST `/cabinet/hosting/:id/panel`.
 */
import type { UiContext, UiField, UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import type { Column } from '../kit.js';

export type ScopeOptions = {
  /** REST розділів панелі */
  api: string;
  /** Сторінка, на якій показано розділи (вкладки — `?tab=`) */
  page: string;
  /** Зафіксований власник (кабінет); без нього — фільтр з URL */
  owner?: string;
  manage: boolean;
};

export class PanelScope {
  readonly api: string;
  readonly page: string;
  readonly manage: boolean;
  private readonly fixedOwner?: string;
  private ownersCache: Promise<string[]> | null = null;

  constructor(readonly ctx: UiContext, readonly serverId: number, options: ScopeOptions) {
    this.api = options.api;
    this.page = options.page;
    this.manage = options.manage;
    this.fixedOwner = options.owner;
  }

  get t() {
    return this.ctx.t;
  }

  /** Кабінет клієнта: власник зафіксований, вибору немає */
  get fixed(): boolean {
    return Boolean(this.fixedOwner);
  }

  get owner(): string | undefined {
    return this.fixedOwner ?? (this.ctx.state.owner || undefined);
  }

  /** `?owner=` для REST (в кабінеті сервер усе одно підставляє власника сам) */
  get ownerQuery(): string {
    return this.owner ? `?owner=${encodeURIComponent(this.owner)}` : '';
  }

  /** Користувачі панелі — для вибору власника; у кабінеті — лише свій */
  owners(): Promise<string[]> {
    if (this.fixedOwner) return Promise.resolve([this.fixedOwner]);
    this.ownersCache ??= hosting.servers.panelAccounts(this.serverId)
      .then((data) => data.accounts.map((account) => account.login).sort())
      .catch(() => []);
    return this.ownersCache;
  }

  /** Посилання на сторінку з параметрами (вкладка, власник-фільтр, зона…) */
  href(params: Record<string, string | undefined>): string {
    const query = new URLSearchParams();
    if (!this.fixed && this.owner) query.set('owner', this.owner);
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    const search = query.toString();
    return `${this.page}${search ? `?${search}` : ''}`;
  }

  /** Колонки таблиці: у кабінеті без «Власник» */
  columns(columns: Column[]): Column[] {
    return this.fixed ? columns.filter((column) => column.key !== 'owner') : columns;
  }

  /** Поле власника форми: у кабінеті — приховане */
  ownerField(): UiField {
    if (this.fixedOwner) return { name: 'owner', kind: 'hidden', value: this.fixedOwner };
    return { name: 'owner', kind: 'select', label: this.t('owner'), required: true, value: this.owner ?? '', options: [] };
  }

  /** Поле власника з варіантами (адмінка) */
  async ownerFieldWithOptions(preferred?: string): Promise<UiField> {
    const field = this.ownerField();
    if (field.kind === 'hidden') return field;
    const owners = await this.owners();
    return { ...field, value: preferred ?? this.owner ?? owners[0] ?? '', options: owners.map((owner) => ({ value: owner, label: owner })) };
  }

  /** Фільтр власника (адмінка, через URL); у кабінеті — нічого */
  async ownerFilter(): Promise<UiNode[]> {
    if (this.fixed) return [];
    const owners = await this.owners();
    return [{
      type: 'form',
      fields: [{
        name: 'owner',
        kind: 'select',
        label: this.t('ownerFilter'),
        value: this.owner ?? '',
        navigate: true,
        options: [{ value: '', label: this.t('allOwners') }, ...owners.map((item) => ({ value: item, label: item }))],
      }],
    }];
  }
}

export type PanelSectionRenderer = (scope: PanelScope) => Promise<UiNode[]>;
