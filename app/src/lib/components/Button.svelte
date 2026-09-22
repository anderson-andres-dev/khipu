<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    variant = "primary",
    disabled = false,
    loading = false,
    children,
    ...rest
  }: {
    variant?: "primary" | "secondary";
    disabled?: boolean;
    loading?: boolean;
    children?: Snippet;
  } & Record<string, unknown> = $props();

  const isDisabled = $derived(disabled || loading);
</script>

<button
  {...rest}
  class="btn {variant}"
  disabled={isDisabled}
  aria-busy={loading ? "true" : undefined}
>
  {@render children?.()}
</button>

<style>
  .btn {
    font: inherit;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    cursor: pointer;
    transition: transform var(--duration-fast);
  }

  .btn.primary {
    background: var(--accent);
    color: var(--text-on-accent);
  }

  .btn.secondary {
    background: var(--surface);
    color: var(--text-primary);
    border-color: var(--border);
  }

  .btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .btn:not(:disabled):active {
    transform: scale(0.97);
  }

  .btn:disabled {
    background: var(--control-disabled);
    color: var(--text-secondary);
    cursor: not-allowed;
  }
</style>
