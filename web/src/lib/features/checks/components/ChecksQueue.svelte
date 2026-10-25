<script lang="ts">
  import { checks, checksBusy, openCheck } from '$lib/features/checks/store';
  import { formatDate, JOB_STATUS, statusLabel } from '$lib/shared/utils';
</script>

<section class="card stack">
  <h2>Черга</h2>
  {#if $checks.length === 0}
    <p class="muted">Перевірок ще немає.</p>
  {:else}
    <table>
      <thead>
        <tr><th>Час</th><th>Статус</th><th>К-сть</th><th></th></tr>
      </thead>
      <tbody>
        {#each $checks as check (check.id)}
          <tr>
            <td>{formatDate(check.createdAt)}</td>
            <td>{statusLabel(JOB_STATUS, check.status)}</td>
            <td>{check.total}</td>
            <td>
              <button class="ghost" type="button" disabled={$checksBusy} onclick={() => openCheck(check.id)}>Відкрити</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>
