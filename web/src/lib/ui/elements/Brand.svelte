<script lang="ts">
  /** Логотип / назва бренду */
  import { APP_NAME } from '$lib/config';

  let { href = '/' }: { href?: string } = $props();
</script>

<a class="ui-brand" {href}>{APP_NAME}</a>

<style>
  .ui-brand {
    font-size: 18px;
    font-weight: 700;
    color: var(--ui-text);
    text-decoration: none;
  }
</style>
