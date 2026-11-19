<script lang="ts">
  /** Мітка-статус (роль, рівень доступу) */
  import type { Snippet } from 'svelte';

  type Tone = 'blue' | 'purple' | 'green' | 'orange' | 'slate';

  let { tone = 'slate', children }: { tone?: Tone; children: Snippet } = $props();
</script>

<span class="ui-badge" style:--tone="var(--ui-tone-{tone})">{@render children()}</span>

<style>
  .ui-badge {
    display: inline-flex;
    align-items: center;
    height: var(--ui-badge-h, 22px);
    padding: 0 8px;
    border: 1px solid color-mix(in srgb, var(--tone) var(--ui-badge-edge, 0%), transparent);
    border-radius: var(--ui-badge-radius, 4px);
    background: color-mix(in srgb, var(--tone) var(--ui-badge-fill, 14%), transparent);
    color: var(--tone);
    font-size: var(--ui-badge-fs, 12px);
    font-weight: 600;
    letter-spacing: var(--ui-badge-spacing, normal);
    white-space: nowrap;
  }
</style>
