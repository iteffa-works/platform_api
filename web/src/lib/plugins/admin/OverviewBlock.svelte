<script lang="ts">
  /** Головна адмінки: показники, розділи за правами, останні користувачі */
  import { can, displayName, user } from '$lib/domain/auth';
  import { formatDate } from '$lib/shared/utils';
  import { DataTable, LinkCard, Panel, StatCard } from '$lib/ui/components';
  import { Avatar, Badge, type IconName } from '$lib/ui/elements';
  import { adminOverview, adminUsers } from './store.js';

  type Tone = 'blue' | 'purple' | 'green' | 'orange' | 'slate';
  type Link = { href: string; label: string; icon: IconName; allowed: boolean };

  const name = $derived(displayName($user));
  const canUsers = $derived(can($user, 'users', 'view'));

  const stats = $derived($adminOverview ? [
    { label: 'Користувачі', value: $adminOverview.users.total, note: `+${$adminOverview.users.thisMonth} цього місяця` },
    { label: 'Ролі', value: $adminOverview.roles.total, note: `${$adminOverview.roles.custom} власних` },
    { label: 'Розділи прав', value: $adminOverview.resources, note: 'оголошують модулі' },
    { label: 'Ваша роль', value: $user?.role.name ?? '', note: $user?.permissions['*'] ? 'усі права' : 'за рівнями' },
  ] : []);

  const cards = $derived(([
    {
      title: 'Користувачі й доступ',
      tone: 'orange',
      links: [
        { href: '/admin/users', label: 'Користувачі', icon: 'users', allowed: canUsers },
        { href: '/admin/roles', label: 'Ролі й права', icon: 'key', allowed: can($user, 'roles', 'view') },
      ],
    },
    {
      title: 'Кабінет',
      tone: 'purple',
      links: [
        { href: '/app', label: 'Огляд кабінету', icon: 'dashboard', allowed: true },
        { href: '/app/account', label: 'Мій акаунт', icon: 'user', allowed: true },
      ],
    },
  ] satisfies { title: string; tone: Tone; links: Link[] }[])
    .map((card) => ({ ...card, links: card.links.filter((link) => link.allowed) }))
    .filter((card) => card.links.length));

  const latest = $derived(
    [...$adminUsers].sort((a, b) => b.id - a.id).slice(0, 5),
  );
</script>

<h1 class="welcome">З поверненням, {name} 👋</h1>

<div class="grid grid--4">
  {#each stats as stat (stat.label)}
    <StatCard label={stat.label} value={stat.value} note={stat.note} />
  {/each}
</div>

<div class="grid grid--cards">
  {#each cards as card (card.title)}
    <LinkCard title={card.title} tone={card.tone} items={card.links} />
  {/each}
</div>

{#if canUsers}
  <Panel title="Останні користувачі" action={{ href: '/admin/users', label: 'Усі' }} flush>
    <DataTable>
      {#snippet head()}
        <tr><th>Користувач</th><th>Роль</th><th>Реєстрація</th></tr>
      {/snippet}
      {#snippet body()}
        {#each latest as row (row.id)}
          <tr>
            <td><span class="person"><Avatar seed={row.email} />{row.email}</span></td>
            <td><Badge tone={row.role.slug === 'developer' ? 'green' : 'blue'}>{row.role.name}</Badge></td>
            <td>{$formatDate(row.createdAt)}</td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  </Panel>
{/if}

<style>
  .welcome {
    font-size: 1.6rem;
  }

  .grid {
    display: grid;
    gap: 16px;
  }

  .grid--4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .grid--cards {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }

  .person {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  @media (max-width: 1000px) {
    .grid--4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .grid--4 {
      grid-template-columns: 1fr;
    }
  }
</style>
