<script lang="ts">
  import { TriangleAlert } from "@lucide/svelte";
  import type { DestructiveStatement } from "$lib/types";

  let { statement, oncancel, onconfirm }: {
    statement: DestructiveStatement;
    oncancel: () => void;
    onconfirm: () => void;
  } = $props();

  const MESSAGES: Record<DestructiveStatement, string> = {
    deleteWithoutWhere: "DELETE sin WHERE · puede afectar todas las filas",
    updateWithoutWhere: "UPDATE sin WHERE · puede afectar todas las filas",
    truncate: "TRUNCATE · elimina todas las filas de la tabla",
    dropTable: "DROP TABLE · elimina la tabla y sus datos",
    dropSchema: "DROP SCHEMA · elimina el esquema",
    dropDatabase: "DROP DATABASE · elimina la base de datos",
    dropColumn: "DROP COLUMN · elimina la columna y sus datos",
  };
</script>

<div class="execution-guard" role="alert">
  <TriangleAlert size={14} aria-hidden="true" />
  <span class="message">{MESSAGES[statement]}</span>
  <div class="actions">
    <button type="button" class="secondary-action" onclick={oncancel}>Cancelar</button>
    <button type="button" class="danger-action" onclick={onconfirm}>Ejecutar de todos modos</button>
  </div>
</div>

<style>
  .execution-guard {
    display: flex;
    flex-wrap: wrap;
    flex-shrink: 0;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    box-sizing: border-box;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--danger) 12%, var(--surface));
    color: var(--text-primary);
    font-size: 0.8125rem;
  }

  .execution-guard :global(svg) {
    flex-shrink: 0;
    color: var(--danger);
  }

  .message {
    flex: 1;
    min-width: 12rem;
  }

  .actions {
    display: flex;
    flex-shrink: 0;
    gap: var(--space-2);
  }

  .actions button {
    min-height: 1.5rem;
    padding: 0 var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .secondary-action {
    background: var(--surface-elevated);
    color: var(--text-primary);
  }

  .danger-action {
    border-color: var(--danger) !important;
    background: var(--danger);
    color: var(--text-on-accent);
  }

  .actions button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: -2px;
  }
</style>
