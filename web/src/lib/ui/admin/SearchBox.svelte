<script lang="ts">
  /** Поле пошуку з іконкою; `onsearch` — після паузи у введенні (debounce) і по Enter */
  import { Icon } from '$lib/ui/elements';

  let {
    value = $bindable(''),
    placeholder = '',
    label,
    delay = 300,
    width = 220,
    onsearch,
  }: {
    value?: string;
    placeholder?: string;
    label?: string;
    delay?: number;
    width?: number;
    onsearch?: (value: string) => void;
  } = $props();

  let timer: ReturnType<typeof setTimeout> | undefined;

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => onsearch?.(value), delay);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    clearTimeout(timer);
    onsearch?.(value);
  }
</script>

<label class="search" style:--w="{width}px">
  <input type="search" bind:value {placeholder} aria-label={label ?? placeholder} oninput={schedule} {onkeydown} />
  <Icon name="search" />
</label>

<style lang="scss">
  .search {
    @include control;
    width: var(--w);
    max-width: 100%;
    padding-right: space(2) + 2px;
    color: var(--ui-muted);
  }

  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--ui-text);

    &::placeholder {
      color: var(--ui-muted);
    }
  }
</style>
