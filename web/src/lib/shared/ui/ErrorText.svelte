<script lang="ts">
  let { message = '' }: { message?: string } = $props();
</script>

{#if message}
  <p class="error">{message}</p>
{/if}
