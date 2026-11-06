<script lang="ts">
  /** Блок форми входу / реєстрації */
  import { goto } from '$app/navigation';
  import { loadMe, loginWithToken, postAuth } from '$lib/domain/auth';
  import { Button, Link } from '$lib/ui/elements';
  import { ErrorText, Field } from '$lib/ui/components';
  import { Row, Stack } from '$lib/ui/patterns';

  let {
    submitLabel,
    endpoint,
    altHref,
    altText,
  }: {
    submitLabel: string;
    endpoint: string;
    altHref: string;
    altText: string;
  } = $props();

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  async function submit(event: Event) {
    event.preventDefault();
    error = '';
    busy = true;
    try {
      const data = await postAuth(endpoint, email, password);
      loginWithToken(data.token);
      await loadMe();
      goto('/app');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Помилка';
    } finally {
      busy = false;
    }
  }
</script>

<form onsubmit={submit}>
  <Stack>
    <Field label="Email" type="email" bind:value={email} autocomplete="email" required />
    <Field label="Пароль" type="password" bind:value={password} autocomplete="current-password" required minlength={8} />
    <ErrorText message={error} />
    <Row>
      <Button type="submit" disabled={busy}>{submitLabel}</Button>
      <Link href={altHref}>{altText}</Link>
    </Row>
  </Stack>
</form>
