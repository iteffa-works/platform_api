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
  <Input {type} bind:value {autocomplete} {inputmode} {required} {minlength} {disabled} />
</Label>
