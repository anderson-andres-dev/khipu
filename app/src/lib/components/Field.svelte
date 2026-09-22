<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  let {
    label,
    id,
    type = "text",
    value = $bindable(),
    options = [],
    placeholder,
    error,
  }: {
    label: string;
    id: string;
    type?: "text" | "password" | "number" | "select";
    value: string | number;
    options?: Option[];
    placeholder?: string;
    error?: string;
  } = $props();

  const errorId = $derived(`${id}-error`);
</script>

<div class="field">
  <label for={id}>{label}</label>

  {#if type === "select"}
    <select
      {id}
      bind:value
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      {#each options as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  {:else}
    <input
      {id}
      {type}
      bind:value
      {placeholder}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? errorId : undefined}
    />
  {/if}

  {#if error}
    <p id={errorId} class="error">{error}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    text-align: left;
  }

  label {
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  input,
  select {
    color: var(--text-primary);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    font: inherit;
  }

  input:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

  input[aria-invalid="true"],
  select[aria-invalid="true"] {
    border-color: var(--danger);
  }

  .error {
    margin: 0;
    color: var(--danger);
    font-size: 0.8125rem;
  }
</style>
