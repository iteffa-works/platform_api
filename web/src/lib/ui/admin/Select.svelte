<script lang="ts">
  /** Компактний select-фільтр у стилі контролів тулбару (нативний список — доступність і мобільні) */
  import { Icon } from '$lib/ui/elements';
  import type { SelectOption } from './types.js';

  let {
    value = $bindable(''),
    options,
    label,
    onchange,
  }: {
    value?: string;
    options: SelectOption[];
    label: string;
    onchange?: (value: string) => void;
  } = $props();
</script>

<label class="select">
  <select bind:value aria-label={label} onchange={() => onchange?.(value)}>
    {#each options as option (option.value)}<option value={option.value}>{option.label}</option>{/each}
  </select>
  <Icon name="chevron-down" size={14} />
</label>

<style lang="scss">
  .select {
    @include control;
    position: relative;
    padding: 0;
    color: var(--ui-muted);

    :global(.ui-icon) {
      position: absolute;
      right: space(2) + 2px;
      pointer-events: none;
    }
  }

  select {
    height: 100%;
    padding: 0 space(8) 0 space(3);
    border: 0;
    outline: none;
    appearance: none;
    background: transparent;
    color: var(--ui-text);
    font-size: var(--ui-fs-sm);
    cursor: pointer;
  }
</style>
