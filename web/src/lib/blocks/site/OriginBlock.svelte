<script lang="ts">
  /** Блок посилання на origin сайту */
  import { APP_ORIGIN } from '$lib/config';
  import { Link, Text } from '$lib/ui/elements';
</script>

<Text tone="muted"><Link href={APP_ORIGIN}>{APP_ORIGIN}</Link></Text>
