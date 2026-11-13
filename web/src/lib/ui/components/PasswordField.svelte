<script lang="ts">
  /** Пароль з показом/приховуванням */
  import { Input, Label } from '$lib/ui/elements';

  let {
    label = 'Пароль',
    value = $bindable(''),
    autocomplete = 'current-password',
    required = false,
    minlength = 8,
    disabled = false,
  }: {
    label?: string;
    value?: string;
    autocomplete?: AutoFill;
    required?: boolean;
    minlength?: number;
    disabled?: boolean;
  } = $props();

  let visible = $state(false);
</script>

<Label>
  {label}
  <div class="ui-password">
    <Input type={visible ? 'text' : 'password'} bind:value {autocomplete} {required} {minlength} {disabled} />
    <button
      class="ui-password__toggle"
      type="button"
      aria-label={visible ? 'Сховати пароль' : 'Показати пароль'}
      onclick={() => (visible = !visible)}
    >
      {#if visible}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 6a9.77 9.77 0 0 1 8.82 5.5A9.77 9.77 0 0 1 12 17a9.77 9.77 0 0 1-8.82-5.5A9.77 9.77 0 0 1 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4Zm0 5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"/></svg>
      {:else}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 3.27 3.28 2 22 20.72 20.73 22l-3.08-3.08A11.77 11.77 0 0 1 12 19c-5 0-9.27-3.11-11-7.5a12.3 12.3 0 0 1 4.1-4.84L2 3.27ZM12 6a9.77 9.77 0 0 1 8.82 5.5 9.64 9.64 0 0 1-3.36 3.86l-1.5-1.5A3.5 3.5 0 0 0 12 8.5c-.3 0-.59.04-.87.11L9.4 6.88C10.22 6.32 11.1 6 12 6Zm-3.5 5.5c0-.2.02-.4.06-.59l4.53 4.53c-.19.04-.39.06-.59.06a3.5 3.5 0 0 1-3.5-3.5Z"/></svg>
      {/if}
    </button>
  </div>
</Label>

<style>
  .ui-password {
    position: relative;
  }

  .ui-password :global(.ui-input) {
    padding-right: 40px;
  }

  .ui-password__toggle {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: var(--ui-radius);
    background: transparent;
    color: var(--ui-muted);
    cursor: pointer;
    display: grid;
    place-items: center;
    padding: 0;
  }

  .ui-password__toggle:hover {
    color: var(--ui-text);
    background: var(--ui-surface-muted);
  }
</style>
