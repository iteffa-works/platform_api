<script lang="ts">
  /** Інформаційний банер */
  let { text }: { text: string } = $props();
</script>

<p class="ui-banner">{text}</p>

<style>
  .ui-banner {
    margin: 0;
    border: 1px dashed var(--ui-border);
    border-radius: var(--ui-radius);
    padding: 12px 14px;
    color: var(--ui-muted);
    background: color-mix(in srgb, var(--ui-accent) 6%, transparent);
  }
</style>
