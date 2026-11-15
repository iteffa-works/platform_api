<script lang="ts">
  /** Головна адмінки: показники, розділи за правами, останні користувачі */
  import { can, displayName, user } from '$lib/domain/auth';
  import { roleName, useI18n, type MessageKey } from '$lib/i18n';
  import { formatDate } from '$lib/shared/utils';
  import { DataTable, LinkCard, Panel, StatCard } from '$lib/ui/components';
  import { Avatar, Badge, type IconName } from '$lib/ui/elements';
  import { adminOverview, adminUsers } from './store.js';

  type Tone = 'blue' | 'purple' | 'green' | 'orange' | 'slate';
  type Link = { href: string; label: MessageKey; icon: IconName; allowed: boolean };

  const { t, tx } = useI18n();

  const name = $derived(displayName($user));
  const canUsers = $derived(can($user, 'users', 'view'));

  const stats = $derived($adminOverview ? [
    { label: $t('nav.users'), value: $adminOverview.users.total, note: $t('admin.stat.thisMonth', { count: $adminOverview.users.thisMonth }) },
    { label: $t('nav.roles'), value: $adminOverview.roles.total, note: $t('admin.stat.custom', { count: $adminOverview.roles.custom }) },
    { label: $t('admin.stat.resources'), value: $adminOverview.resources, note: $t('admin.stat.resourcesNote') },
    { label: $t('admin.stat.yourRole'), value: roleName($tx, $user?.role), note: $user?.permissions['*'] ? $t('admin.stat.allRights') : $t('admin.stat.byLevels') },
  ] : []);

  const cards = $derived(([
    {
      title: 'nav.group.access',
      tone: 'orange',
      links: [
        { href: '/admin/users', label: 'nav.users', icon: 'users', allowed: canUsers },
        { href: '/admin/roles', label: 'nav.roles', icon: 'key', allowed: can($user, 'roles', 'view') },
      ],
    },
    {
      title: 'nav.group.system',
      tone: 'green',
      links: [
        { href: '/admin/billing', label: 'nav.billingAdmin', icon: 'wallet', allowed: can($user, 'billing', 'view') },
        { href: '/admin/activity', label: 'nav.activityAdmin', icon: 'list', allowed: can($user, 'logs', 'view') },
      ],
    },
    {
      title: 'nav.cabinet',
      tone: 'purple',
      links: [
        { href: '/app', label: 'nav.overview', icon: 'dashboard', allowed: true },
        { href: '/app/account', label: 'nav.account', icon: 'user', allowed: true },
      ],
    },
  ] satisfies { title: MessageKey; tone: Tone; links: Link[] }[])
    .map((card) => ({
      ...card,
      title: $t(card.title),
      links: card.links.filter((link) => link.allowed).map((link) => ({ ...link, label: $t(link.label) })),
    }))
    .filter((card) => card.links.length));

  const latest = $derived(
    [...$adminUsers].sort((a, b) => b.id - a.id).slice(0, 5),
  );
</script>

<h1 class="welcome">{$t('admin.welcome', { name })} 👋</h1>

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
  <Panel title={$t('admin.latestUsers')} action={{ href: '/admin/users', label: $t('common.viewAll') }} flush>
    <DataTable>
      {#snippet head()}
        <tr><th>{$t('users.user')}</th><th>{$t('overview.role')}</th><th>{$t('common.registered')}</th></tr>
      {/snippet}
      {#snippet body()}
        {#each latest as row (row.id)}
          <tr>
            <td><span class="person"><Avatar seed={row.email} src={row.avatarUrl} />{row.email}</span></td>
            <td><Badge tone={row.role.slug === 'developer' ? 'green' : 'blue'}>{roleName($tx, row.role)}</Badge></td>
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
