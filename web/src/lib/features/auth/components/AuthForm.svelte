<script lang="ts">
  import { goto } from '$app/navigation';
  import { postAuth } from '$lib/features/auth/api';
  import { loadMe, loginWithToken } from '$lib/features/auth/store';
  import ErrorText from '$lib/shared/ui/ErrorText.svelte';

  type Props = {
    title: string;
    submitLabel: string;
    endpoint: string;
    altHref: string;
    altText: string;
  };

  let { title, submitLabel, endpoint, altHref, altText }: Props = $props();
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

<section class="card stack auth">
  <h1>{title}</h1>
  <form class="stack" onsubmit={submit}>
    <label>Email <input type="email" bind:value={email} autocomplete="email" required /></label>
    <label>Пароль <input type="password" bind:value={password} autocomplete="current-password" minlength="8" required /></label>
    <ErrorText message={error} />
    <div class="row">
      <button type="submit" disabled={busy}>{submitLabel}</button>
      <a href={altHref}>{altText}</a>
    </div>
  </form>
</section>
