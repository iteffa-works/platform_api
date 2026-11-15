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

<form class="form" class:is-stack={node.layout === 'stack'} onsubmit={submit}>
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
              {#each option.lines ?? [] as line, index (index)}<small><UiInline value={line} /></small>{/each}
            </label>
          {/each}
        </div>
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

  {#if node.submit}
    <div class="submit">
      <Button type="submit" variant={node.submit.variant ?? 'primary'} size={node.submit.size ?? 'md'} disabled={$busy || node.submit.disabled}>
        {node.submit.label}
      </Button>
    </div>
  {/if}
</form>

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
    border-radius: 12px;
    cursor: pointer;
  }

  .is-cards .choice__item {
    padding: 14px;
  }

  .choice__item.is-active {
    border-color: var(--ui-accent);
    background: var(--ui-accent-soft);
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
    border-radius: 10px;
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
