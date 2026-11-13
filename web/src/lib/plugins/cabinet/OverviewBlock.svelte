<script lang="ts">
  /** Огляд кабінету: роль, доступи, дата реєстрації */
  import { formatDate } from '$lib/shared/utils';
  import { Card } from '$lib/ui/components';
  import { Button, Text } from '$lib/ui/elements';
  import { profile } from './store.js';

  const stats = $derived($profile ? [
    { label: 'Роль', value: $profile.user.role.name },
    { label: 'Доступні розділи', value: String($profile.access.length) },
    { label: 'З нами з', value: formatDate($profile.user.createdAt) },
  ] : []);
</script>

{#if $profile}
  <Card>
    <h2>Вітаємо, {$profile.user.email}</h2>
    <Text tone="muted">Сервіси платформи зʼявлятимуться тут у міру підключення.</Text>
  </Card>

  <div class="stats">
    {#each stats as stat (stat.label)}
      <Card>
        <Text tone="muted">{stat.label}</Text>
        <p class="stats__value">{stat.value}</p>
      </Card>
    {/each}
  </div>

  <Card>
    <h2>Профіль і доступи</h2>
    <Text tone="muted">Ваш email, роль і рівні прав у розділах платформи.</Text>
    <div><Button variant="ghost" href="/app/profile">Відкрити профіль</Button></div>
  </Card>
{/if}

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .stats__value {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
  }

  @media (max-width: 720px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
</style>
