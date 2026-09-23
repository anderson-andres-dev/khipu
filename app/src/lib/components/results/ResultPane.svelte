<script lang="ts">
  import type { QueryExecutionResult } from "$lib/types";
  import DataGrid from "$lib/components/results/DataGrid.svelte";

  let { isExecuting, result }: { isExecuting: boolean; result: QueryExecutionResult | null } = $props();
</script>

<div class="result-pane">
  {#if isExecuting}
    <div class="placeholder">Ejecutando…</div>
  {:else if result === null}
    <div class="placeholder">Ejecuta una consulta para ver los resultados aquí.</div>
  {:else if result.type === "error"}
    <div class="error">
      <p class="message">{result.message}</p>
      {#if result.code || result.position !== undefined}
        <p class="meta">
          {#if result.code}{result.code}{/if}
          {#if result.code && result.position !== undefined} · {/if}
          {#if result.position !== undefined}posición {result.position}{/if}
        </p>
      {/if}
    </div>
  {:else if result.type === "command"}
    <div class="output">
      <p>Output: consulta ejecutada correctamente.</p>
      <p class="meta">{result.affectedRows} filas afectadas · {result.executionTimeMs} ms</p>
    </div>
  {:else if result.rows.length === 0}
    <div class="empty">
      <p class="placeholder">No se devolvieron filas.</p>
      <div class="status-bar">
        0 rows · {result.columns.length} columns · {result.executionTimeMs} ms
      </div>
    </div>
  {:else}
    <div class="grid-region">
      <div class="grid-scroll">
        <DataGrid columns={result.columns} rows={result.rows} />
      </div>
      <div class="status-bar">
        {result.rowCount} rows · {result.columns.length} columns · {result.executionTimeMs} ms
        {#if result.truncated}
          <span class="truncated" title="Se alcanzó el límite de filas; hay más resultados sin mostrar.">
            · Limited
          </span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .result-pane {
    display: flex;
    min-height: 0;
    height: 100%;
    flex-direction: column;
  }

  .placeholder {
    padding: var(--space-3);
    color: var(--text-secondary);
    font-size: 0.8125rem;
  }

  .error,
  .output {
    padding: var(--space-3);
    font-size: 0.8125rem;
  }

  .error .message {
    margin: 0;
    color: var(--danger);
  }

  .output p {
    margin: 0;
  }

  .meta {
    margin: var(--space-1) 0 0;
    color: var(--text-secondary);
  }

  .empty,
  .grid-region {
    display: flex;
    min-height: 0;
    height: 100%;
    flex-direction: column;
  }

  .grid-scroll {
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }

  .status-bar {
    flex-shrink: 0;
    padding: var(--space-1) var(--space-3);
    border-top: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .truncated {
    color: var(--danger);
  }
</style>
