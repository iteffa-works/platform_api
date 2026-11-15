<script lang="ts">
  /** Рівень доступу: мітка + шкала з трьох точок (перегляд → керування) */
  import { LEVEL_KEYS } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import type { GrantLevel } from '$lib/shared/types';
  import { Badge } from '$lib/ui/elements';

  let { level }: { level: GrantLevel } = $props();

  const { t } = useI18n();
  const RANK: Record<GrantLevel, number> = { view: 1, edit: 2, manage: 3 };
  const TONE = { view: 'blue', edit: 'orange', manage: 'green' } as const;
</script>

<span class="level">
  <span class="level__dots" aria-hidden="true">
    {#each [1, 2, 3] as step (step)}
      <i class:is-on={step <= RANK[level]} style:--tone="var(--ui-tone-{TONE[level]})"></i>
    {/each}
  </span>
  <Badge tone={TONE[level]}>{$t(LEVEL_KEYS[level])}</Badge>
</span>

<style>
  .level {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  .level__dots {
    display: inline-flex;
    gap: 4px;
  }

  .level__dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--ui-border);
  }

  .level__dots i.is-on {
    background: var(--tone);
  }
</style>
