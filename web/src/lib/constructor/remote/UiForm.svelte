<script lang="ts">
  /** Форма зі схеми: поля, живі поля (перерендер сторінки), підсумок і кнопка-дія */
  import { goto } from '$app/navigation';
  import { page as route } from '$app/stores';
  import { untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { Field } from '$lib/ui/components';
  import { Button } from '$lib/ui/elements';
  import type { Values } from './actions.js';
  import { useRemote } from './context.js';
  import type { UiField, UiForm } from './schema.js';
  import UiInline from './UiInline.svelte';
  import UiNode from './UiNode.svelte';

  let { node }: { node: UiForm } = $props();

  const remote = useRemote();
  const busy = remote.busy;
  // Значення ініціалізуються зі схеми; після перерендеру форма монтується заново (ключ у RemotePage)
  const initial = (field: UiField): string | boolean => field.value ?? (field.kind === 'checkbox' ? false : '');
  let values = $state<Values>(untrack(() => Object.fromEntries(node.fields.map((field) => [field.name, initial(field)]))));

  function change(field: UiField, value: string | boolean) {
    values[field.name] = value;
    if (field.navigate) {
      // Фільтр у URL: ?name=value (порожньо — прибрати), переживає дії й оновлення сторінки
      const url = new URL(get(route).url);
      if (value === '' || value === false) url.searchParams.delete(field.name);
      else url.searchParams.set(field.name, String(value));
      void goto(`${url.pathname}${url.search}`, { keepFocus: true, noScroll: true });
    } else if (field.live) {
      remote.refresh($state.snapshot(values));
    }
  }

  function submit(event: Event) {
    event.preventDefault();
    if (node.submit) void remote.run(node.submit.action, $state.snapshot(values));
  }

  const autocomplete = (field: UiField) => field.autocomplete as AutoFill | undefined;
  const inputmode = (field: UiField) => (field.kind === 'number' ? 'numeric' : undefined);
  const listId = (field: UiField) => `ui-list-${field.name}`;
</script>

{#snippet fieldList()}
  {#each node.fields as field (field.name)}
    {#if field.kind === 'hidden'}
      <!-- значення передається з values -->
    {:else if field.kind === 'choice'}
      <fieldset class="choice">
        {#if field.label}<legend>{field.label}</legend>{/if}
        <div class="choice__items" class:is-cards={field.options?.some((option) => option.lines?.length)}>
          {#each field.options ?? [] as option (option.value)}
            <label class="choice__item" class:is-active={values[field.name] === option.value} class:is-disabled={option.disabled}>
              <input
                type="radio"
                name={field.name}
                value={option.value}
                checked={values[field.name] === option.value}
                disabled={option.disabled}
                onchange={() => change(field, option.value)}
              />
              <span class="choice__label">
                {#if option.media}<UiNode node={option.media} />{/if}
                <strong>{option.label}</strong>
              </span>
              {#if option.accent}<span class="choice__accent"><UiInline value={option.accent} /></span>{/if}
              {#each option.lines ?? [] as line, index (index)}<small><UiInline value={line} /></small>{/each}
            </label>
          {/each}
        </div>
        {#if field.hint}<small class="hint">{field.hint}</small>{/if}
      </fieldset>
    {:else if field.kind === 'select'}
      <label class="select" class:is-grow={field.grow}>
        <span>{field.label}</span>
        <select value={values[field.name]} required={field.required} onchange={(event) => change(field, event.currentTarget.value)}>
          {#each field.options ?? [] as option (option.value)}
            <option value={option.value} disabled={option.disabled}>{option.label}</option>
          {/each}
        </select>
      </label>
    {:else if field.kind === 'checkbox'}
      <label class="check">
        <input type="checkbox" checked={values[field.name] === true} onchange={(event) => change(field, event.currentTarget.checked)} />
        {field.label}
      </label>
    {:else}
      <div class="text" class:is-grow={field.grow}>
        {#if field.options?.length}
          <label class="select">
            <span>{field.label}</span>
            <input
              list={listId(field)}
              value={values[field.name]}
              required={field.required}
              oninput={(event) => (values[field.name] = event.currentTarget.value)}
              onchange={(event) => change(field, event.currentTarget.value)}
            />
            <datalist id={listId(field)}>{#each field.options as option (option.value)}<option value={option.value}></option>{/each}</datalist>
          </label>
        {:else}
          <Field
            label={field.label ?? ''}
            type={field.kind}
            value={String(values[field.name] ?? '')}
            required={field.required}
            minlength={field.minlength}
            autocomplete={autocomplete(field)}
            inputmode={inputmode(field)}
            grow={field.grow}
            placeholder={field.placeholder}
            oninput={(value: string) => (values[field.name] = value)}
            onchange={(value: string) => change(field, value)}
          />
        {/if}
        {#if field.hint}<small class="hint">{field.hint}</small>{/if}
      </div>
    {/if}
  {/each}

  {#each node.footer ?? [] as child, index (index)}<div class="footer"><UiNode node={child} /></div>{/each}
{/snippet}

{#snippet submitButton()}
  {#if node.submit}
    <div class="submit">
      <Button type="submit" variant={node.submit.variant ?? 'primary'} size={node.submit.size ?? 'md'} disabled={$busy || node.submit.disabled}>
        {node.submit.label}
      </Button>
    </div>
  {/if}
{/snippet}

{#if node.aside?.length}
  <!-- Оформлення: кроки ліворуч, липкий підсумок з кнопкою праворуч -->
  <form class="checkout" onsubmit={submit}>
    <div class="checkout__main">{@render fieldList()}</div>
    <aside class="checkout__aside">
      {#each node.aside as child, index (index)}<UiNode node={child} />{/each}
      {@render submitButton()}
    </aside>
  </form>
{:else}
  <form class="form" class:is-stack={node.layout === 'stack'} onsubmit={submit}>
    {@render fieldList()}
    {@render submitButton()}
  </form>
{/if}

<style>
  .form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
  }

  .form.is-stack {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .text {
    display: grid;
    gap: 4px;
  }

  .is-grow {
    flex: 1 1 220px;
  }

  .hint {
    max-width: 640px;
    color: var(--ui-muted);
  }

  .footer {
    flex-basis: 100%;
  }

  .submit {
    display: flex;
  }

  .choice {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .choice legend {
    margin-bottom: 8px;
    font-weight: 700;
  }

  .choice__items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .choice__items.is-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 12px;
  }

  .choice__item {
    position: relative;
    display: grid;
    gap: 4px;
    padding: 8px 14px;
    border: 2px solid var(--ui-border);
    border-radius: var(--ui-radius-lg);
    cursor: pointer;
  }

  .is-cards .choice__item {
    padding: 14px;
  }

  .choice__item.is-active {
    border-color: var(--ui-accent);
    background: var(--ui-accent-soft);
  }

  /* Позначка вибраної картки */
  .is-cards .choice__item.is-active::after {
    content: '✓';
    position: absolute;
    top: 10px;
    right: 10px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--ui-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
  }

  .choice__item:hover:not(.is-active):not(.is-disabled) {
    border-color: color-mix(in srgb, var(--ui-accent) 45%, var(--ui-border));
  }

  .choice__accent {
    font-size: 18px;
    font-weight: 800;
  }

  .choice .hint {
    display: block;
    margin-top: 8px;
  }

  /* Оформлення замовлення */
  .checkout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
    gap: 20px;
  }

  .checkout__main,
  .checkout__aside {
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, 12px);
    background: var(--ui-surface);
    box-shadow: var(--ui-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  }

  .checkout__main > :global(*) {
    padding: 20px;
  }

  .checkout__main > :global(* + *) {
    border-top: 1px solid var(--ui-border-soft, var(--ui-border));
  }

  .checkout__main .choice legend {
    float: left;
    width: 100%;
    margin-bottom: 12px;
    font-size: 15px;
  }

  .checkout__main .choice__items {
    clear: both;
  }

  .checkout__aside {
    position: sticky;
    top: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
  }

  .checkout__aside .submit :global(button) {
    width: 100%;
    justify-content: center;
  }

  @media (max-width: 860px) {
    .checkout {
      grid-template-columns: minmax(0, 1fr);
    }

    .checkout__aside {
      position: static;
    }
  }

  .choice__item.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .choice__item input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .choice__item:has(input:focus-visible) {
    outline: 2px solid var(--ui-accent);
    outline-offset: 2px;
  }

  .choice__label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .choice__item small {
    color: var(--ui-muted);
  }

  .select {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .select select,
  .select input {
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
    color: inherit;
    font: inherit;
    font-weight: 400;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    font-size: 14px;
  }
</style>
