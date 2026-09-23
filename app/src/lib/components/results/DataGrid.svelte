<script lang="ts">
  import type { QueryColumn, QueryRow } from "$lib/types";

  let { columns, rows }: { columns: QueryColumn[]; rows: QueryRow[] } = $props();

  // Selección de una sola celda por ahora (fase futura: rango/fila/columna
  // completa — ver el plan de arquitectura del result grid).
  let selected = $state<{ row: number; col: number } | null>(null);

  function selectCell(row: number, col: number) {
    selected = { row, col };
  }

  function onCellKeydown(event: KeyboardEvent, row: number, col: number) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectCell(row, col);
  }
</script>

<div class="data-grid">
  <table>
    <thead>
      <tr>
        <th class="row-number-header" scope="col" aria-hidden="true"></th>
        {#each columns as column, columnIndex (columnIndex)}
          <th scope="col" title={column.type}>{column.name}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, rowIndex (rowIndex)}
        <tr>
          <th class="row-number" scope="row">{rowIndex + 1}</th>
          {#each row as value, columnIndex (columnIndex)}
            <td
              class:selected={selected?.row === rowIndex && selected?.col === columnIndex}
              tabindex="0"
              onclick={() => selectCell(rowIndex, columnIndex)}
              onkeydown={(event) => onCellKeydown(event, rowIndex, columnIndex)}
            >
              {#if value === null}
                <span class="null-value">NULL</span>
              {:else if value === ""}
                <span class="visually-hidden">cadena vacía</span>
              {:else}
                {value}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .data-grid {
    height: 100%;
    overflow: auto;
  }

  table {
    border-collapse: separate;
    border-spacing: 0;
    width: max-content;
    min-width: 100%;
    font-size: 0.8125rem;
  }

  th,
  td {
    box-sizing: border-box;
    padding: 0 var(--space-2);
    height: 1.75rem;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    text-align: left;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--surface-elevated);
    color: var(--text-secondary);
    font-weight: var(--font-weight-heading);
  }

  .row-number,
  .row-number-header {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--surface-elevated);
    color: var(--text-secondary);
    text-align: right;
    font-weight: 400;
  }

  thead .row-number-header {
    z-index: 3;
  }

  tbody th.row-number {
    background: var(--surface);
  }

  td {
    color: var(--text-primary);
    cursor: default;
    outline: none;
  }

  td.selected {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    outline: 1px solid var(--accent);
    outline-offset: -1px;
  }

  td:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: -2px;
  }

  .null-value {
    color: var(--text-secondary);
    font-style: italic;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
</style>
