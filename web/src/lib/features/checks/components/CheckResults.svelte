<script lang="ts">
  import { activeCheck, cancelActiveCheck, checksBusy } from '$lib/features/checks/store';
  import { JOB_STATUS, nickname, RESULT_STATUS, statusLabel } from '$lib/shared/utils';
</script>

{#if $activeCheck}
  <section class="card stack">
    <div class="row">
      <h2 class="grow">Результат · {statusLabel(JOB_STATUS, $activeCheck.status)}</h2>
      {#if $activeCheck.status === 'queued'}
        <button class="ghost" type="button" disabled={$checksBusy} onclick={cancelActiveCheck}>Скасувати</button>
      {/if}
    </div>
    <table>
      <thead>
        <tr>
          <th>Телефон</th>
          <th>Username</th>
          <th>Нікнейм</th>
          <th>Активність</th>
          <th>User ID</th>
          <th>Статус</th>
          <th>Помилка</th>
        </tr>
      </thead>
      <tbody>
        {#each $activeCheck.results || [] as row (row.id)}
          <tr>
            <td>{row.phone || (row.kind === 'phone' ? row.query : '—')}</td>
            <td>{row.username ? `@${row.username}` : (row.kind === 'username' ? row.query : '—')}</td>
            <td>{nickname(row.firstName, row.lastName) || '—'}</td>
            <td>{row.lastSeen || '—'}</td>
            <td>{row.telegramUserId || '—'}</td>
            <td>{statusLabel(RESULT_STATUS, row.status)}</td>
            <td>{row.error || '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/if}
