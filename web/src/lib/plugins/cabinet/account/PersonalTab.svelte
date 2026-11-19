<script lang="ts">
  /** Персональні дані для рахунків: імʼя, контакти, компанія, адреса */
  import { onMount } from 'svelte';
  import { loadMe, user } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import { errorMessage } from '$lib/shared/utils';
  import { ErrorText, Field } from '$lib/ui/components';
  import { Button, Flag, Text } from '$lib/ui/elements';
  import * as cabinetApi from '../api.js';
  import type { PersonalDetails } from '../api.js';

  const { locale, t } = useI18n();

  const EMPTY: PersonalDetails = { phone: '', company: '', taxId: '', country: '', region: '', city: '', address: '', postalCode: '' };
  /** Службові коди ISO / CLDR, які не є країнами */
  const NOT_COUNTRIES = new Set(['AC', 'CP', 'DG', 'EA', 'EU', 'EZ', 'IC', 'QO', 'TA', 'UN', 'XA', 'XB', 'ZZ']);

  let name = $state($user?.name ?? '');
  let form = $state<PersonalDetails>({ ...EMPTY });
  let loaded = $state(false);
  let busy = $state(false);
  let error = $state('');
  let notice = $state('');

  /** Країни мовою інтерфейсу; Україна — першою */
  const countries = $derived.by(() => {
    const names = new Intl.DisplayNames([$locale], { type: 'region' });
    const list: { code: string; name: string }[] = [];
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        if (NOT_COUNTRIES.has(code)) continue;
        const label = names.of(code);
        if (label && label !== code) list.push({ code, name: label });
      }
    }
    list.sort((x, y) => x.name.localeCompare(y.name, $locale));
    const ua = list.findIndex((item) => item.code === 'UA');
    if (ua > 0) list.unshift(...list.splice(ua, 1));
    return list;
  });

  onMount(async () => {
    try {
      form = { ...EMPTY, ...(await cabinetApi.fetchDetails()).details };
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loaded = true;
    }
  });

  async function save(event: Event) {
    event.preventDefault();
    busy = true;
    error = '';
    notice = '';
    try {
      if (name.trim() !== ($user?.name ?? '')) {
        await cabinetApi.updateAccount(name.trim());
        await loadMe();
      }
      form = { ...EMPTY, ...(await cabinetApi.updateDetails(form)).details };
      notice = $t('account.saved');
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }
</script>

<form class="tab" onsubmit={save}>
  <p class="lead"><Text tone="muted">{$t('personal.hint')}</Text></p>

  <fieldset class="group" disabled={!loaded || busy}>
    <legend>{$t('personal.contacts')}</legend>
    <div class="grid">
      <div class="wide"><Field label={$t('personal.fullName')} bind:value={name} autocomplete="name" /></div>
      <Field label="Email" value={$user?.email ?? ''} disabled />
      <Field label={$t('personal.phone')} type="tel" bind:value={form.phone} autocomplete="tel" inputmode="tel" placeholder="+380 XX XXX XX XX" />
      <Field label={$t('personal.company')} bind:value={form.company} autocomplete="organization" />
      <Field label={$t('personal.taxId')} bind:value={form.taxId} inputmode="numeric" />
    </div>
  </fieldset>

  <fieldset class="group" disabled={!loaded || busy}>
    <legend>{$t('personal.address')}</legend>
    <div class="grid">
      <label class="select">
        <span>{$t('personal.country')}</span>
        <span class="select__box">
          {#if form.country}<Flag code={form.country} />{/if}
          <select bind:value={form.country} autocomplete="country">
            <option value="">{$t('personal.countryPick')}</option>
            {#each countries as country (country.code)}
              <option value={country.code}>{country.name}</option>
            {/each}
          </select>
        </span>
      </label>
      <Field label={$t('personal.region')} bind:value={form.region} autocomplete="address-level1" />
      <Field label={$t('personal.city')} bind:value={form.city} autocomplete="address-level2" />
      <Field label={$t('personal.postalCode')} bind:value={form.postalCode} autocomplete="postal-code" />
      <div class="wide"><Field label={$t('personal.street')} bind:value={form.address} autocomplete="street-address" /></div>
    </div>
  </fieldset>

  <div class="foot">
    <ErrorText message={error} />
    {#if notice}<p class="notice">{notice}</p>{/if}
    <Button type="submit" disabled={!loaded || busy}>{$t('common.save')}</Button>
  </div>
</form>

<style>
  .tab {
    display: grid;
    gap: 16px;
    padding-top: 16px;
  }

  .lead {
    margin: 0;
  }

  .group {
    margin: 0;
    padding: 16px 20px 20px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, var(--ui-radius));
    background: var(--ui-surface);
  }

  .group legend {
    padding: 0 6px;
    margin-left: -6px;
    font-size: 13px;
    font-weight: 700;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
  }

  .wide {
    display: grid;
    grid-column: 1 / -1;
  }

  .select {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .select__box {
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--ui-control-h);
    padding: 0 0 0 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }

  .select select {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0 8px 0 0;
    border: 0;
    background: transparent;
    color: var(--ui-text);
    font: inherit;
    font-weight: 400;
  }

  .select select:focus {
    outline: none;
  }

  .select__box:focus-within {
    border-color: var(--ui-accent);
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
  }

  .notice {
    margin: 0;
    color: var(--ui-success);
    font-weight: 600;
  }

  @media (max-width: 720px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
