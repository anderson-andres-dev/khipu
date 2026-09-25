<script lang="ts">
  import { Table, TableProperties } from "@lucide/svelte";
  import type { ColumnCatalogInfo, QueryExecutionResult, ResultPage } from "$lib/types";
  import DataGrid from "$lib/components/results/DataGrid.svelte";
  import ResultPager from "$lib/components/results/ResultPager.svelte";

  let {
    isExecuting,
    result,
    resultSql = null,
    resultAt = null,
    sourceLabel = null,
    columnCatalogInfo = null,
    page = null,
    totalRows = null,
    counting = false,
    nextPageShortcut = "",
    previousPageShortcut = "",
    onnavigate = () => {},
    oncount = async () => null,
  }: {
    isExecuting: boolean;
    result: QueryExecutionResult | null;
    resultSql?: string | null;
    resultAt?: number | null;
    sourceLabel?: string | null;
    columnCatalogInfo?: Map<string, ColumnCatalogInfo> | null;
    page?: ResultPage | null;
    totalRows?: number | null;
    counting?: boolean;
    nextPageShortcut?: string;
    previousPageShortcut?: string;
    onnavigate?: (offset: number, pageSize: number) => void;
    oncount?: () => Promise<number | null>;
  } = $props();

  const numberFormat = new Intl.NumberFormat("es");

  // Marca de tiempo al estilo del log de DataGrip: 2026-09-24 19:15:48.801,
  // en hora local.
  function formatTimestamp(epochMs: number): string {
    const date = new Date(epochMs);
    const pad = (value: number, length = 2) => String(value).padStart(length, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
    );
  }

  // "[1064] You have an error in your SQL syntax…" (+ la posicion, si el
  // driver la informa). pre-wrap respeta los saltos de linea del mensaje.
  function errorText(error: { message: string; code?: string; position?: number }): string {
    const code = error.code ? `[${error.code}] ` : "";
    const position = error.position !== undefined ? ` (posición ${error.position})` : "";
    return `${code}${error.message}${position}`;
  }

  const timestamp = $derived(resultAt === null ? "" : formatTimestamp(resultAt));
</script>

<div class="result-pane">
  {#if sourceLabel && (isExecuting || result !== null)}
    <div class="result-tabs">
      <div class="result-tab">
        <Table size={12} aria-hidden="true" />
        <span>{sourceLabel}</span>
      </div>
    </div>
  {/if}
  <!-- Con un resultado en pantalla (cambio de pagina, re-ejecucion), el grid
       se queda y encima aparece el loader: no parpadea a vacio. -->
  {#if isExecuting && result?.type !== "resultSet"}
    <div class="centered">
      <div class="spinner" role="status" aria-label="Ejecutando consulta"></div>
    </div>
  {:else if result === null}
    <div class="centered empty-state">
      <TableProperties size={28} strokeWidth={1.25} aria-hidden="true" />
      <span>Sin resultados</span>
    </div>
  {:else if result.type === "error"}
    <!-- Log al estilo consola: la consulta ejecutada y debajo el error, cada
         bloque con su marca de tiempo y las lineas siguientes alineadas. -->
    <div class="error-log" role="alert">
      {#if resultSql}
        <span class="log-time">[{timestamp}]</span>
        <span class="log-sql"><span class="log-prompt">&gt;</span> {resultSql.trim()}</span>
      {/if}
      <span class="log-time">[{timestamp}]</span>
      <span class="log-error">{errorText(result)}</span>
    </div>
  {:else if result.type === "command"}
    <div class="output">
      <p>Output: consulta ejecutada correctamente.</p>
      <p class="meta">{result.affectedRows} filas afectadas · {result.executionTimeMs} ms</p>
    </div>
  {:else}
    <div class="grid-region">
      <div class="grid-scroll">
        {#if result.rows.length === 0}
          <p class="placeholder">No se devolvieron filas.</p>
        {:else}
          <DataGrid
            columns={result.columns}
            rows={result.rows}
            rowOffset={page?.offset ?? 0}
            {columnCatalogInfo}
          />
        {/if}
        {#if isExecuting}
          <div class="busy-overlay">
            <div class="spinner" role="status" aria-label="Cargando página"></div>
          </div>
        {/if}
      </div>
      <!-- Barra fija al pie: estadisticas a la izquierda y la paginacion
           centrada en el panel (grid de tres columnas: el centro no se
           corre aunque cambie el ancho del texto de los costados). -->
      <div class="status-bar">
        <span class="stats">
          {numberFormat.format(result.rows.length)} filas · {result.columns.length} columnas · {result.executionTimeMs} ms
          {#if result.truncated && !page?.pageable}
            <span class="truncated" title="Esta sentencia no se puede paginar: se muestran solo las primeras filas.">
              · Limitado
            </span>
          {/if}
        </span>
        {#if page}
          <ResultPager
            {page}
            rowCount={result.rows.length}
            hasMore={result.truncated}
            {totalRows}
            {counting}
            busy={isExecuting}
            nextShortcut={nextPageShortcut}
            previousShortcut={previousPageShortcut}
            {onnavigate}
            {oncount}
          />
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
    margin: 0;
    padding: var(--space-3);
    color: var(--text-secondary);
    font-size: 0.8125rem;
  }

  .output {
    padding: var(--space-3);
    font-size: 0.8125rem;
  }

  .centered {
    display: flex;
    min-height: 0;
    flex: 1;
    align-items: center;
    justify-content: center;
  }

  .empty-state {
    flex-direction: column;
    gap: var(--space-2);
    color: color-mix(in srgb, var(--text-secondary) 70%, transparent);
    font-size: 0.8125rem;
    user-select: none;
  }

  .empty-state :global(svg) {
    opacity: 0.6;
  }

  .spinner {
    width: 1.5rem;
    height: 1.5rem;
    box-sizing: border-box;
    border: 2px solid color-mix(in srgb, var(--text-secondary) 25%, transparent);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 2s;
    }
  }

  /* Dos columnas: la marca de tiempo y el texto. Las lineas siguientes de
     una consulta o mensaje multilinea quedan alineadas bajo el texto, no
     bajo la hora. */
  .error-log {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    align-content: start;
    column-gap: var(--space-2);
    row-gap: var(--space-1);
    min-height: 0;
    flex: 1;
    overflow: auto;
    padding: var(--space-3);
    background: var(--surface-content);
    font-family: ui-monospace, SFMono-Regular, "SF Mono", "JetBrains Mono", Consolas, monospace;
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  .log-time {
    color: var(--text-secondary);
    user-select: none;
  }

  .log-sql,
  .log-error {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .log-sql {
    color: var(--text-primary);
  }

  .log-prompt {
    color: var(--text-secondary);
  }

  .log-error {
    color: var(--danger);
  }


  .output p {
    margin: 0;
  }

  .meta {
    margin: var(--space-1) 0 0;
    color: var(--text-secondary);
  }

  /* Misma pinta que las pestañas de consola del workspace (.console-tab):
     una "pestaña de resultado" al estilo DataGrip. Todavía no es fijable/
     cerrable — hoy solo hay un resultado a la vez — pero ya representa el
     lugar donde vivirán esas pestañas cuando existan varias. */
  .result-tabs {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--space-1);
    min-height: 2.25rem;
    padding: var(--space-1) var(--space-2);
    box-sizing: border-box;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .result-tab {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 1.75rem;
    padding: 0 var(--space-3);
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--accent) 72%, var(--border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--accent) 18%, var(--surface-elevated));
    color: var(--text-primary);
    font-size: 0.75rem;
  }

  .result-tab :global(svg) {
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  .grid-region {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
  }

  /* El cuerpo del resultado va sobre --surface-content: en los temas
     claros es blanco como el editor (en los oscuros, igual que surface). */
  .grid-region {
    background: var(--surface-content);
  }

  .grid-scroll {
    position: relative;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }

  .busy-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--surface-content) 55%, transparent);
    animation: overlay-in 120ms ease;
  }

  @keyframes overlay-in {
    from {
      opacity: 0;
    }
  }

  .status-bar {
    display: grid;
    flex-shrink: 0;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-3);
    min-height: 2.5rem;
    padding: var(--space-1) var(--space-3);
    box-sizing: border-box;
    border-top: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .stats {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .truncated {
    color: var(--danger);
  }
</style>
