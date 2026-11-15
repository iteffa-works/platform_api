<script lang="ts">
  /** Поле вводу */
  let {
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    autocomplete,
    inputmode,
    required = false,
    minlength,
    disabled = false,
    oninput,
    onchange,
  }: {
    type?: string;
    value?: string;
    placeholder?: string;
    autocomplete?: AutoFill;
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    required?: boolean;
    minlength?: number;
    disabled?: boolean;
    /** Значення під час вводу / після завершення (для форм без bind) */
    oninput?: (value: string) => void;
    onchange?: (value: string) => void;
  } = $props();
</script>

<input
  class="ui-input"
  {type}
  bind:value
  {placeholder}
  {autocomplete}
  {inputmode}
  {required}
  {minlength}
  {disabled}
  oninput={(event) => oninput?.(event.currentTarget.value)}
  onchange={(event) => onchange?.(event.currentTarget.value)}
/>

<style>
  .ui-input {
    width: 100%;
    height: var(--ui-control-h);
    padding: 0 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    font: inherit;
  }

  .ui-input:disabled {
    background: var(--ui-surface-muted);
    color: var(--ui-muted);
    cursor: not-allowed;
  }
</style>
