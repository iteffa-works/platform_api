<script lang="ts">
  /** Єдина точка рендеру: сторінка з каталогу конструктора */
  import { PageHost } from '$lib/constructor';

  let { data }: { data: { page: import('$lib/constructor').PageDefinition } } = $props();
</script>

<PageHost page={data.page} />
