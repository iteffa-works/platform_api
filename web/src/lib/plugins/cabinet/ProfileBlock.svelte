<script lang="ts">
  /** Профіль: дані акаунта й рівні прав за роллю */
  import { LEVEL_LABELS } from '$lib/domain/auth';
  import { formatDate } from '$lib/shared/utils';
  import { Card, DataTable, EmptyState } from '$lib/ui/components';
  import { Text } from '$lib/ui/elements';
  import { profile } from './store.js';

  const isDeveloper = $derived(Boolean($profile?.user.permissions['*']));
</script>

{#if $profile}
  <Card>
    <h2>Акаунт</h2>
    <dl class="facts">
      <dt>Email</dt><dd>{$profile.user.email}</dd>
      <dt>Роль</dt><dd>{$profile.user.role.name}</dd>
      <dt>Реєстрація</dt><dd>{formatDate($profile.user.createdAt)}</dd>
    </dl>
  </Card>

  <Card>
    <h2>Доступи</h2>
    {#if isDeveloper}
      <Text tone="muted">Роль розробника: усі права, зокрема в майбутніх модулях.</Text>
    {/if}
    {#if $profile.access.length === 0}
      <EmptyState text="Додаткових доступів немає — лише власний кабінет." />
    {:else}
      <DataTable>
        {#snippet head()}
          <tr><th>Розділ</th><th>Рівень</th></tr>
        {/snippet}
        {#snippet body()}
          {#each $profile.access as item (item.key)}
            <tr><td>{item.label}</td><td>{LEVEL_LABELS[item.level]}</td></tr>
          {/each}
        {/snippet}
      </DataTable>
    {/if}
  </Card>
{/if}

<style>
  .facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 10px 24px;
    margin: 0;
  }

  .facts dt {
    color: var(--ui-muted);
  }

  .facts dd {
    margin: 0;
    font-weight: 600;
  }
</style>
