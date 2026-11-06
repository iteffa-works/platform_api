<script lang="ts">
  /** Шаблон форми авторизації */
  import type { Snippet } from 'svelte';
  import { Card } from '$lib/ui/components';
  import { AuthLayout } from '$lib/ui/layouts';

  let {
    title,
    children,
  }: {
    title: string;
    children: Snippet;
  } = $props();
</script>

<AuthLayout>
  <Card narrow>
    <h1>{title}</h1>
    {@render children()}
  </Card>
</AuthLayout>
