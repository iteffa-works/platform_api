<script lang="ts">
  import AuthForm from '$lib/features/auth/components/AuthForm.svelte';
</script>

<AuthForm
  title="Реєстрація"
  submitLabel="Створити акаунт"
  endpoint="/auth/register"
  altHref="/login"
  altText="Вже є акаунт"
/>
