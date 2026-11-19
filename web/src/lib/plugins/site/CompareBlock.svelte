<script lang="ts">
  /**
   * Порівняння тарифів — розширена інформація: усі ліміти й можливості шаблонів панелі в одній таблиці.
   * Ті самі дані, що й у картках (`/public/hosting/plans`); хостинг вимкнено — секції немає.
   */
  import { onMount } from 'svelte';
  import { useI18n, type TextKey } from '$lib/i18n';
  import { formatMoney } from '$lib/shared/utils';
  import { Button, Flag, Icon } from '$lib/ui/elements';
  import { isFree, loadShowcase, orderHref, showcase, size, type ShowcasePlan } from './catalog.js';

  const { t, locale } = useI18n();

  onMount(loadShowcase);

  type Cell = { text: string } | { flag: boolean };
  type Row = { label: TextKey; cell: (plan: ShowcasePlan) => Cell };

  /** null — без обмеження, 0 — немає */
  const count = (value: number | null): Cell => ({ text: value === null ? '∞' : value === 0 ? '—' : String(value) });
  const flag = (value: boolean | undefined): Cell => ({ flag: Boolean(value) });

  const groups: Array<{ title: TextKey; rows: Row[] }> = [
    {
      title: 'landing.compare.resources',
      rows: [
        { label: 'landing.limit.disk', cell: (plan) => ({ text: size(plan.diskMb) ?? '∞' }) },
        { label: 'landing.limit.sites', cell: (plan) => count(plan.sites) },
        { label: 'landing.limit.databases', cell: (plan) => count(plan.databases) },
        { label: 'landing.limit.ftp', cell: (plan) => count(plan.ftpUsers) },
        { label: 'landing.limit.cron', cell: (plan) => count(plan.cronJobs) },
      ],
    },
    {
      title: 'landing.compare.mail',
      rows: [
        { label: 'landing.limit.mailDomains', cell: (plan) => count(plan.mailDomains) },
        { label: 'landing.limit.mailboxes', cell: (plan) => count(plan.mailboxes) },
      ],
    },
    {
      title: 'landing.compare.tools',
      rows: [
        { label: 'landing.limit.ssl', cell: (plan) => flag(plan.features?.ssl ?? true) },
        { label: 'landing.limit.backup', cell: (plan) => flag(plan.features?.backup) },
        { label: 'landing.limit.ssh', cell: (plan) => flag(plan.features?.ssh) },
        { label: 'landing.limit.git', cell: (plan) => flag(plan.features?.git) },
        { label: 'landing.limit.nodejs', cell: (plan) => flag(plan.features?.nodejs) },
      ],
    },
  ];

  const regionName = (code: string) => {
    try {
      return new Intl.DisplayNames([$locale], { type: 'region' }).of(code) ?? code;
    } catch {
      return code;
    }
  };
</script>

{#if $showcase}
  <section class="lp-section" id="compare">
    <div class="ui-container">
      <div class="lp-head">
        <p class="lp-eyebrow">{$t('landing.compare.eyebrow')}</p>
        <h2 class="lp-title">{$t('landing.compare.title')}</h2>
        <p class="lp-lead">{$t('landing.compare.lead')}</p>
      </div>

      <div class="table">
        <table>
          <thead>
            <tr>
              <th scope="col">{$t('landing.compare.parameter')}</th>
              {#each $showcase.plans as plan (plan.id)}
                <th scope="col" class:is-featured={plan.featured}>
                  <span class="name">{plan.name}</span>
                  <span class="price">{isFree(plan) ? $t('landing.plans.free') : `${$formatMoney(plan.price, $showcase.currency)} ${$t('landing.plans.perMonth')}`}</span>
                </th>
              {/each}
            </tr>
          </thead>
          {#each groups as group (group.title)}
            <tbody>
              <tr class="group"><th scope="rowgroup" colspan={$showcase.plans.length + 1}>{$t(group.title)}</th></tr>
              {#each group.rows as row (row.label)}
                <tr>
                  <th scope="row">{$t(row.label)}</th>
                  {#each $showcase.plans as plan (plan.id)}
                    {@const cell = row.cell(plan)}
                    <td class:is-featured={plan.featured}>
                      {#if 'flag' in cell}
                        <span class="mark" class:is-on={cell.flag}><Icon name={cell.flag ? 'check' : 'close'} size={14} /></span>
                      {:else}
                        <span class:is-none={cell.text === '—'}>{cell.text}</span>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          {/each}
          <tfoot>
            <tr>
              <th scope="row">{$t('landing.limit.locations')}</th>
              <td colspan={$showcase.plans.length}>
                <span class="flags">
                  {#each $showcase.locations as code (code)}<span><Flag {code} size={16} />{regionName(code)}</span>{/each}
                </span>
              </td>
            </tr>
            <tr class="actions">
              <th scope="row"></th>
              {#each $showcase.plans as plan (plan.id)}
                <td class:is-featured={plan.featured}>
                  <Button variant={plan.featured ? 'primary' : 'ghost'} href={orderHref(plan)}>
                    {isFree(plan) ? $t('landing.plans.startFree') : $t('landing.plans.order')}
                  </Button>
                </td>
              {/each}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
{/if}

<style>
  .table {
    overflow-x: auto;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg);
    background: var(--ui-surface);
  }

  table {
    width: 100%;
    min-width: 760px;
    border-collapse: collapse;
    font-size: 13px;
  }

  th,
  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--ui-border-soft);
    text-align: center;
    vertical-align: middle;
  }

  /* Перша колонка — назви параметрів, липка при прокрутці вбік */
  th[scope='row'],
  thead th:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--ui-surface);
    color: var(--ui-text-2);
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
  }

  thead th {
    border-bottom: 2px solid var(--ui-accent);
    background: var(--ui-surface-muted);
    vertical-align: bottom;
  }

  thead th:first-child {
    background: var(--ui-surface-muted);
    color: var(--ui-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  thead .name {
    display: block;
    font-size: 15px;
    font-weight: 800;
  }

  thead .price {
    display: block;
    margin-top: 2px;
    color: var(--ui-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .group th {
    background: var(--ui-surface-muted);
    color: var(--ui-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
  }

  td {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  td.is-featured,
  th.is-featured {
    background: var(--ui-accent-soft);
  }

  .is-none {
    color: var(--ui-muted);
    font-weight: 400;
  }

  .mark {
    display: inline-grid;
    place-items: center;
    color: var(--ui-muted);
    opacity: 0.6;
  }

  .mark.is-on {
    color: var(--ui-success);
    opacity: 1;
  }

  tbody tr:not(.group):hover td,
  tbody tr:not(.group):hover th[scope='row'] {
    background: var(--ui-row-hover);
  }

  .flags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-weight: 600;
  }

  .flags span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .actions td,
  .actions th {
    border-bottom: 0;
    padding-block: 14px;
  }

  .actions td :global(.ui-btn) {
    width: 100%;
    justify-content: center;
  }
</style>
