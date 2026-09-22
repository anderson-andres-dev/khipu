<script lang="ts">
  import { RefreshCw, Search, Table, X } from "@lucide/svelte";
  import type { CatalogTable } from "$lib/types";

  let {
    tables,
    refreshing = false,
    onrefresh,
  }: {
    tables: CatalogTable[];
    refreshing?: boolean;
    onrefresh: () => void;
  } = $props();

  let filter = $state("");

  const groups = $derived.by(() => {
    const query = filter.trim().toLowerCase();
    const bySchema = new Map<string, CatalogTable[]>();
    for (const table of tables) {
      if (query && !table.name.toLowerCase().includes(query)) continue;
      const list = bySchema.get(table.schema) ?? [];
      list.push(table);
      bySchema.set(table.schema, list);
    }
    return [...bySchema.entries()].sort(([a], [b]) => a.localeCompare(b));
  });
</script>

<div class="schema-tree">
  <div class="toolbar">
    <div class="filter">
      <Search size={13} class="filter-icon" aria-hidden="true" />
      <input
        type="text"
        placeholder="Filtrar tablas..."
        aria-label="Filtrar tablas"
        bind:value={filter}
      />
      {#if filter}
        <button type="button" class="clear-filter" aria-label="Limpiar filtro" onclick={() => (filter = "")}>
          <X size={12} aria-hidden="true" />
        </button>
      {/if}
    </div>
    <button
      type="button"
      class="refresh-button"
      class:spinning={refreshing}
      aria-label="Recargar tablas"
      title="Recargar tablas"
      disabled={refreshing}
      onclick={onrefresh}
    >
      <RefreshCw size={13} aria-hidden="true" />
    </button>
  </div>

  <nav class="tree-scroll" aria-label="Tablas de la base de datos">
    {#each groups as [schema, schemaTables] (schema)}
      <details open>
        <summary>
          <span class="schema-name">{schema}</span>
          <span class="count">{schemaTables.length}</span>
        </summary>
        <ul>
          {#each schemaTables as table (table.name)}
            <li title={table.name}>
              <Table size={13} class="table-icon" aria-hidden="true" />
              <span class="table-name">{table.name}</span>
            </li>
          {/each}
        </ul>
      </details>
    {:else}
      <p class="empty">{filter ? "Sin coincidencias." : "Sin tablas."}</p>
    {/each}
  </nav>
</div>

<style>
  .schema-tree {
    display: flex;
    height: 100%;
    flex-direction: column;
    font-size: 0.8rem;
  }

  .toolbar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2);
  }

  .filter {
    position: relative;
    min-width: 0;
    flex: 1;
  }

  .filter :global(.filter-icon) {
    position: absolute;
    top: 50%;
    left: var(--space-2);
    color: var(--text-secondary);
    transform: translateY(-50%);
  }

  .filter input {
    box-sizing: border-box;
    width: 100%;
    min-height: 1.75rem;
    padding: var(--space-1) var(--space-5) var(--space-1) 1.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    font: inherit;
    font-size: 0.75rem;
  }

  .filter input:focus-visible {
    border-color: var(--focus-ring);
    outline: 1px solid var(--focus-ring);
    outline-offset: 0;
  }

  .clear-filter {
    position: absolute;
    top: 50%;
    right: calc(var(--space-2) + 2px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transform: translateY(-50%);
  }

  .clear-filter:hover {
    color: var(--text-primary);
  }

  .refresh-button {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-height: 1.75rem;
    width: 1.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      color var(--duration-fast),
      background-color var(--duration-fast),
      border-color var(--duration-fast);
  }

  .refresh-button:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--control-border);
  }

  .refresh-button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

  .refresh-button:disabled {
    cursor: not-allowed;
  }

  .refresh-button.spinning :global(svg) {
    animation: refresh-spin 0.7s linear infinite;
  }

  @keyframes refresh-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .refresh-button.spinning :global(svg) {
      animation: none;
    }
  }

  .tree-scroll {
    overflow-y: auto;
    min-height: 0;
    padding: 0 var(--space-2) var(--space-2);
    box-sizing: border-box;
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary:hover {
    background: var(--surface-elevated);
  }

  .schema-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    flex-shrink: 0;
    color: var(--text-secondary);
    font-size: 0.7rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0 0 0 var(--space-2);
  }

  li {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: 0.2rem var(--space-2);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  li:hover {
    background: var(--surface-elevated);
  }

  li :global(.table-icon) {
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  .table-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty {
    color: var(--text-secondary);
    padding: var(--space-2);
  }
</style>
