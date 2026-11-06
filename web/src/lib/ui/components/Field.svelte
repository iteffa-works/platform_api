<script lang="ts">
  /** Поле форми: підпис + input */
  import { Input, Label } from '$lib/ui/elements';

  let {
    label,
    type = 'text',
    value = $bindable(''),
    grow = false,
    autocomplete,
    inputmode,
    required = false,
    minlength,
    disabled = false,
  }: {
    label: string;
    type?: string;
    value?: string;
    grow?: boolean;
    autocomplete?: AutoFill;
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    required?: boolean;
    minlength?: number;
    disabled?: boolean;
  } = $props();
</script>

<Label {grow}>
  {label}
  <span class="ui-field-control">
    <Input {type} bind:value {autocomplete} {inputmode} {required} {minlength} {disabled} />
  </span>
</Label>

<style>
  .ui-field-control :global(.ui-input) {
    padding: 0.7rem 0.85rem;
  }
</style>
