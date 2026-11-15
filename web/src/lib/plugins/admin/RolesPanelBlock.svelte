<script lang="ts">
  /** Ролі: матриця «ресурс × рівень», створення й видалення — без змін у коді */
  import { can, DEVELOPER_ROLE, LEVEL_KEYS, user } from '$lib/domain/auth';
  import { roleName, useI18n } from '$lib/i18n';
  import type { GrantLevel, Permissions, Role } from '$lib/shared/types';
  import { DataTable, Field, Panel } from '$lib/ui/components';
  import { Badge, Button, Text } from '$lib/ui/elements';
  import { Row } from '$lib/ui/patterns';
  import {
    adminBusy,
    adminResources,
    adminRoles,
    createRole,
    removeRole,
    saveRolePermissions,
  } from './store.js';

  const canManage = $derived(can($user, 'roles', 'manage'));
  const { t, tx } = useI18n();

  /** Чернетки прав: roleId → права; скидаються після кожного завантаження ролей */
  let drafts = $state<Record<number, Permissions>>({});
  $effect(() => {
    drafts = Object.fromEntries($adminRoles.map((role) => [role.id, { ...role.permissions }]));
  });

  let newName = $state('');
  let newSlug = $state('');

  function locked(role: Role): boolean {
    return !canManage || role.slug === DEVELOPER_ROLE;
  }

  function setLevel(role: Role, resource: string, value: string) {
    const next = { ...drafts[role.id] };
    if (value === 'none') delete next[resource];
    else next[resource] = value as GrantLevel;
    drafts[role.id] = next;
  }

  function isDirty(role: Role): boolean {
    const draft = drafts[role.id] ?? {};
    const keys = new Set([...Object.keys(draft), ...Object.keys(role.permissions)]);
    return [...keys].some((key) => draft[key] !== role.permissions[key]);
  }

  async function submitNew(event: Event) {
    event.preventDefault();
    await createRole(newSlug.trim(), newName.trim());
    newName = '';
    newSlug = '';
  }
</script>

<Panel title="{$t('nav.roles')} · {$adminRoles.length}" flush>
  <DataTable>
    {#snippet head()}
      <tr>
        <th>{$t('overview.role')}</th>
        <th>{$t('roles.usersShort')}</th>
        {#each $adminResources as resource (resource.key)}
          <th>{$tx(`resource.${resource.key}`, resource.label)}</th>
        {/each}
        <th></th>
      </tr>
    {/snippet}
    {#snippet body()}
      {#each $adminRoles as role (role.id)}
        <tr>
          <td>
            <strong>{roleName($tx, role)}</strong>
            <small class="roles__slug">{role.slug}{role.isSystem ? ` · ${$t('roles.system')}` : ''}</small>
          </td>
          <td>{role.users}</td>
          {#each $adminResources as resource (resource.key)}
            <td>
              {#if role.slug === DEVELOPER_ROLE}
                <Badge tone="green">{$t('roles.all')}</Badge>
              {:else if locked(role)}
                {$t(LEVEL_KEYS[role.permissions[resource.key] ?? 'none'])}
              {:else}
                <select
                  class="roles__select"
                  value={drafts[role.id]?.[resource.key] ?? 'none'}
                  disabled={$adminBusy}
                  aria-label="{role.name}: {$tx(`resource.${resource.key}`, resource.label)}"
                  onchange={(event) => setLevel(role, resource.key, event.currentTarget.value)}
                >
                  <option value="none">{$t(LEVEL_KEYS.none)}</option>
                  {#each resource.levels as level (level)}
                    <option value={level}>{$t(LEVEL_KEYS[level])}</option>
                  {/each}
                </select>
              {/if}
            </td>
          {/each}
          <td>
            {#if !locked(role)}
              <Row>
                <Button
                  variant="ghost"
                  disabled={$adminBusy || !isDirty(role)}
                  onclick={() => saveRolePermissions(role.id, drafts[role.id])}
                >{$t('common.save')}</Button>
                {#if !role.isSystem}
                  <Button variant="ghost" disabled={$adminBusy} onclick={() => removeRole(role, $t)}>{$t('common.delete')}</Button>
                {/if}
              </Row>
            {/if}
          </td>
        </tr>
      {/each}
    {/snippet}
  </DataTable>
</Panel>

{#if canManage}
  <Panel title={$t('roles.new')}>
    <form class="roles__new" onsubmit={submitNew}>
      <Field label={$t('roles.name')} bind:value={newName} required grow />
      <Field label={$t('roles.slug')} bind:value={newSlug} required grow />
      <Button type="submit" disabled={$adminBusy}>{$t('common.create')}</Button>
    </form>
    <Text tone="muted">{$t('roles.newHint')}</Text>
  </Panel>
{/if}

<style>
  .roles__slug {
    display: block;
    color: var(--ui-muted);
    font-size: 12px;
  }

  .roles__select {
    height: 34px;
    padding: 0 8px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }

  .roles__new {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
  }
</style>
