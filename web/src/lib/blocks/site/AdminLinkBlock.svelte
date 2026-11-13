<script lang="ts">
  /** Посилання в адмінку, якщо роль дає доступ */
  import { can, user } from '$lib/domain/auth';
  import { Button } from '$lib/ui/elements';
</script>

{#if can($user, 'admin.panel', 'view')}
  <Button variant="ghost" href="/admin">Адмінка</Button>
{/if}
