<script lang="ts">
  /** Рядковий вміст: текст, значення (гроші / дати — мовою й поясом користувача), жирні фрагменти */
  import { formatDate, formatDateTime, formatMoney } from '$lib/shared/utils';
  import Self from './UiInline.svelte';
  import type { Inline } from './schema.js';

  let { value }: { value: Inline } = $props();
</script>

{#if typeof value === 'string'}{value}{:else if Array.isArray(value)}{#each value as part, index (index)}<Self value={part} />{/each}{:else if 'b' in value}<strong>{value.b}</strong>{:else if value.type === 'money'}{$formatMoney(value.amount, value.currency)}{:else if value.type === 'date'}{$formatDate(value.value)}{:else if value.type === 'datetime'}{$formatDateTime(value.value)}{/if}
