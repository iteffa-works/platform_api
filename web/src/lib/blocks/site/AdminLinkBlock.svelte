<script lang="ts">
  /** Посилання в адмінку для admin */
  import { user } from '$lib/domain/auth';
  import { Button } from '$lib/ui/elements';
</script>

{#if $user?.role === 'admin'}
  <Button variant="ghost" href="/admin">Адмінка</Button>
{/if}
