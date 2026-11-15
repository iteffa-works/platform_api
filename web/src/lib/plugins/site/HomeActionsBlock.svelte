<script lang="ts">
  /** CTA залежно від сесії: компактні (шапка) або великі (hero, фінальний блок) */
  import { isAuthenticated } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import { Button } from '$lib/ui/elements';

  const { t } = useI18n();

  let { size = 'md' }: { size?: 'md' | 'lg' } = $props();
</script>

{#if $isAuthenticated}
  <Button {size} href="/app">{$t('landing.openCabinet')}</Button>
{:else}
  <Button {size} variant="ghost" href="/login">{$t('auth.signIn')}</Button>
  <Button {size} href="/register">{$t('auth.createAccount')}</Button>
{/if}
