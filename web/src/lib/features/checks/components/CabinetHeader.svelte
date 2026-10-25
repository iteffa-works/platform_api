<script lang="ts">
  import { accountsError } from '$lib/features/accounts';
  import { user } from '$lib/features/auth';
  import { checksError } from '$lib/features/checks/store';
  import Banner from '$lib/shared/ui/Banner.svelte';
  import ErrorText from '$lib/shared/ui/ErrorText.svelte';
</script>

<section class="card stack">
  <div class="row">
    <div class="grow">
      <h1>Кабінет</h1>
      <p class="muted">{$user?.email || ''}</p>
    </div>
  </div>
  <Banner text="Черга в API; Telegram-воркер підключимо пізніше." />
  <ErrorText message={$accountsError || $checksError} />
</section>
