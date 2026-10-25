<script lang="ts">
  import AuthForm from '$lib/features/auth/components/AuthForm.svelte';
</script>

<AuthForm
  title="Вхід"
  submitLabel="Увійти"
  endpoint="/auth/login"
  altHref="/register"
  altText="Немає акаунта"
/>
