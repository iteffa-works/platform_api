<script lang="ts">
  /** Ролі: матриця «ресурс × рівень», створення й видалення — без змін у коді */
  import { can, DEVELOPER_ROLE, LEVEL_LABELS, user } from '$lib/domain/auth';
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

<Panel title="Ролі · {$adminRoles.length}" flush>
  <DataTable>
    {#snippet head()}
      <tr>
        <th>Роль</th>
        <th>Корист.</th>
        {#each $adminResources as resource (resource.key)}
          <th>{resource.label}</th>
        {/each}
        <th></th>
      </tr>
    {/snippet}
    {#snippet body()}
      {#each $adminRoles as role (role.id)}
        <tr>
          <td>
            <strong>{role.name}</strong>
            <small class="roles__slug">{role.slug}{role.isSystem ? ' · системна' : ''}</small>
          </td>
          <td>{role.users}</td>
          {#each $adminResources as resource (resource.key)}
            <td>
              {#if role.slug === DEVELOPER_ROLE}
                <Badge tone="green">Усі</Badge>
              {:else if locked(role)}
                {LEVEL_LABELS[role.permissions[resource.key] ?? 'none']}
              {:else}
                <select
                  class="roles__select"
                  value={drafts[role.id]?.[resource.key] ?? 'none'}
                  disabled={$adminBusy}
                  aria-label="{role.name}: {resource.label}"
                  onchange={(event) => setLevel(role, resource.key, event.currentTarget.value)}
                >
                  <option value="none">{LEVEL_LABELS.none}</option>
                  {#each resource.levels as level (level)}
                    <option value={level}>{LEVEL_LABELS[level]}</option>
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
                >Зберегти</Button>
                {#if !role.isSystem}
                  <Button variant="ghost" disabled={$adminBusy} onclick={() => removeRole(role)}>Видалити</Button>
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
  <Panel title="Нова роль">
    <form class="roles__new" onsubmit={submitNew}>
      <Field label="Назва" bind:value={newName} required grow />
      <Field label="Ключ (латиницею, напр. support)" bind:value={newSlug} required grow />
      <Button type="submit" disabled={$adminBusy}>Створити</Button>
    </form>
    <Text tone="muted">Права нової ролі налаштовуються в таблиці вище.</Text>
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
