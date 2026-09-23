<script lang="ts">
  import { tick } from "svelte";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
  import { Plus, X } from "@lucide/svelte";
  import SqlEditor from "$lib/SqlEditor.svelte";
  import ContextMenu from "$lib/components/ContextMenu.svelte";
  import ExecutionGuard from "$lib/components/ExecutionGuard.svelte";
  import ResultPane from "$lib/components/results/ResultPane.svelte";
  import TableDefinitionModal from "$lib/components/TableDefinitionModal.svelte";
  import type { CatalogTableRef } from "$lib/sqlDefinitionLink";
  import type { ContextMenuItem } from "$lib/contextMenu";
  import { catalogTables, connection } from "$lib/stores/connection";
  import { connectionProfiles } from "$lib/stores/connectionProfiles";
  import { eventMatchesShortcut, shortcuts } from "$lib/stores/shortcuts";
  import { extractFromContext } from "$lib/sqlSchema";
  import { executeQuery } from "$lib/queryExecution";
  import type { CatalogColumn, CatalogTable, ColumnCatalogInfo, ExecuteQueryResponse } from "$lib/types";
  import {
    activateQueryConsole,
    beginQueryExecution,
    cancelQueryConfirmation,
    closeQueryConsole,
    createQueryConsole,
    ensureQueryConsole,
    executionForConsole,
    finishQueryExecution,
    queryConsoles,
    renameQueryConsole,
    requireQueryConfirmation,
    takeQueryConfirmation,
    updateQueryConsoleSql,
  } from "$lib/stores/queryConsoles";

  const profileId = $derived($connection.profileId ?? "default");
  const consoles = $derived($queryConsoles.consoles.filter((item) => item.profileId === profileId));
  const activeId = $derived($queryConsoles.activeByProfile[profileId]);
  const activeConsole = $derived(consoles.find((item) => item.id === activeId));
  const execution = $derived(
    activeConsole
      ? executionForConsole($queryConsoles, activeConsole.id)
      : { isExecuting: false, result: null, resultSql: null, pendingConfirmation: null },
  );
  const activeProfile = $derived($connectionProfiles.find((profile) => profile.id === profileId));
  // Tabla principal (primer FROM) de la consulta que produjo el resultado
  // vigente — no la del texto actual del editor, que puede haber cambiado
  // desde la ejecucion. Solo resuelve el caso simple (sin JOIN); con varias
  // tablas se toma la primera, igual que el resto de heuristicas de
  // sqlSchema.ts.
  const resultTableName = $derived.by(() => {
    const sql = execution.resultSql;
    return sql ? extractFromContext(sql, sql.length)?.table : undefined;
  });
  // Rotula el resultado con esa tabla: "schema.tabla", al estilo DataGrip.
  // Si no hay un FROM reconocible (p.ej. "SELECT 1"), cae al schema solo.
  const resultSourceLabel = $derived.by(() => {
    if (!execution.resultSql || !activeProfile) return null;
    const schema = activeProfile.database || activeProfile.name;
    return resultTableName ? `${schema}.${resultTableName}` : schema;
  });
  // Para cada columna del resultado que coincide (por nombre) con una
  // columna del catalogo ya cargado, expone si es PK/FK y su comentario —
  // sin pedirle nada nuevo al backend, reusando el catalogo que ya existe
  // para el arbol de tablas y el autocompletado.
  //
  // Busca en TODAS las tablas, no solo en resultTableName: con un JOIN
  // (USING/ON), columnas como "clie_codi" vienen de la tabla unida, no de
  // la primera del FROM, y resultTableName solo resuelve esa primera. Si
  // el mismo nombre de columna existe en mas de una tabla, gana
  // resultTableName cuando aplica (es la señal mas confiable de a que
  // tabla pertenece), y si no, la primera tabla del catalogo que la tenga.
  const resultColumnCatalogInfo = $derived.by((): Map<string, ColumnCatalogInfo> | null => {
    const tables = $catalogTables;
    if (tables.length === 0) return null;

    function toColumnInfo(column: CatalogColumn, table: CatalogTable): ColumnCatalogInfo {
      const fkColumns = new Set(table.foreignKeys.map((fk) => fk.column.toLowerCase()));
      return {
        isPrimaryKey: column.isPrimaryKey,
        isForeignKey: fkColumns.has(column.name.toLowerCase()),
        comment: column.comment,
      };
    }

    const map = new Map<string, ColumnCatalogInfo>();
    for (const table of tables) {
      for (const column of table.columns) {
        const key = column.name.toLowerCase();
        if (!map.has(key)) map.set(key, toColumnInfo(column, table));
      }
    }

    const mainTable = tables.find((t) => t.name.toLowerCase() === resultTableName?.toLowerCase());
    if (mainTable) {
      for (const column of mainTable.columns) {
        map.set(column.name.toLowerCase(), toColumnInfo(column, mainTable));
      }
    }

    return map;
  });
  let tableDefinitionRequest = $state<CatalogTableRef | null>(null);
  // "schema@host", igual que resultSourceLabel usa "database || name" como
  // nombre de schema (ver mas abajo) - la misma convencion para las dos
  // etiquetas de origen que puede ver el usuario.
  const dataSourceLabel = $derived(
    activeProfile ? `${activeProfile.database || activeProfile.name}@${activeProfile.host}` : "",
  );
  let editorFraction = $state(0.6);
  let workspaceBody = $state<HTMLElement>();
  let tabMenu = $state<{ x: number; y: number; id: string } | null>(null);
  let renamingId = $state<string | null>(null);
  let renameValue = $state("");
  let renameInput = $state<HTMLInputElement>();
  let closeDialog = $state<HTMLDialogElement>();
  let pendingCloseId = $state<string | null>(null);
  const pendingCloseConsole = $derived(consoles.find((item) => item.id === pendingCloseId));

  function shortcutKeys(id: string): string {
    return $shortcuts.find((shortcut) => shortcut.id === id)?.keys ?? "";
  }

  const tabMenuItems = $derived.by((): ContextMenuItem[] => {
    const id = tabMenu?.id;
    if (!id) return [];
    const item = consoles.find((candidate) => candidate.id === id);
    if (!item) return [];
    return [
      {
        label: "Cambiar nombre",
        shortcut: shortcutKeys("rename-query-console"),
        action: () => startRename(item.id, item.title),
      },
      {
        label: "Cerrar consola",
        shortcut: shortcutKeys("close-query-console"),
        action: () => requestClose(item.id),
      },
      {
        label: "Nueva consola",
        shortcut: shortcutKeys("new-query-console"),
        separatorBefore: true,
        action: () => {
          createQueryConsole(profileId);
        },
      },
    ];
  });

  $effect(() => {
    ensureQueryConsole(profileId);
  });

  function closeConsole(event: Event, id: string) {
    event.stopPropagation();
    void requestClose(id);
  }

  function openTabMenu(event: MouseEvent, id: string) {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new Event("khipu:context-menu"));
    activateQueryConsole(profileId, id);
    tabMenu = { x: event.clientX, y: event.clientY, id };
  }

  async function startRename(id: string, title: string) {
    renamingId = id;
    renameValue = title;
    await tick();
    renameInput?.focus();
    renameInput?.select();
  }

  function finishRename(save: boolean) {
    if (save && renamingId) renameQueryConsole(renamingId, renameValue);
    renamingId = null;
  }

  async function requestClose(id: string) {
    tabMenu = null;
    pendingCloseId = id;
    await tick();
    closeDialog?.showModal();
  }

  function cancelClose() {
    closeDialog?.close();
    pendingCloseId = null;
  }

  function confirmClose() {
    if (pendingCloseId) closeQueryConsole(profileId, pendingCloseId);
    closeDialog?.close();
    pendingCloseId = null;
  }

  function handleConsoleShortcut(event: KeyboardEvent) {
    if (event.defaultPrevented || closeDialog?.open) return;
    if (event.target instanceof Element && event.target.closest("dialog")) return;

    const newConsoleKeys = shortcutKeys("new-query-console");
    if (newConsoleKeys && eventMatchesShortcut(event, newConsoleKeys)) {
      event.preventDefault();
      tabMenu = null;
      renamingId = null;
      createQueryConsole(profileId);
      return;
    }

    const renameKeys = shortcutKeys("rename-query-console");
    if (renameKeys && activeConsole && eventMatchesShortcut(event, renameKeys)) {
      event.preventDefault();
      void startRename(activeConsole.id, activeConsole.title);
      return;
    }

    const closeKeys = shortcutKeys("close-query-console");
    if (closeKeys && activeConsole && eventMatchesShortcut(event, closeKeys)) {
      event.preventDefault();
      void requestClose(activeConsole.id);
    }
  }

  function applyExecuteQueryResponse(consoleId: string, sql: string, response: ExecuteQueryResponse) {
    if (response.type === "confirmationRequired") {
      requireQueryConfirmation(consoleId, { sql, statement: response.statement });
      return;
    }
    finishQueryExecution(consoleId, sql, response.result);
  }

  // Solicita una ejecucion nueva (Ctrl+Enter o el boton "Ejecutar"). No hace
  // nada si esa consola ya esta ejecutando o tiene un guard visible —
  // beginQueryExecution() ya contempla ambos casos, asi que repetir
  // Ctrl+Enter mientras el guard esta arriba no dispara una segunda
  // invocacion ni confirma nada por si solo.
  async function requestExecution(consoleId: string, sql: string) {
    if (!beginQueryExecution(consoleId)) return;
    const response = await executeQuery(sql, null);
    applyExecuteQueryResponse(consoleId, sql, response);
  }

  // Unica via de confirmacion: el click explicito en "Ejecutar de todos
  // modos" del guard. takeQueryConfirmation() retira el pendiente de forma
  // atomica antes del await, asi que un doble click no puede confirmar dos
  // veces.
  async function confirmPendingExecution(consoleId: string) {
    const pending = takeQueryConfirmation(consoleId);
    if (!pending || !beginQueryExecution(consoleId)) return;
    const response = await executeQuery(pending.sql, pending.statement);
    applyExecuteQueryResponse(consoleId, pending.sql, response);
  }

  function cancelPendingExecution(consoleId: string) {
    cancelQueryConfirmation(consoleId);
  }

  function startResize(event: PointerEvent) {
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);

    function onMove(moveEvent: PointerEvent) {
      if (!workspaceBody) return;
      const rect = workspaceBody.getBoundingClientRect();
      const fraction = (moveEvent.clientY - rect.top) / rect.height;
      editorFraction = Math.min(0.85, Math.max(0.15, fraction));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onSplitterKeydown(event: KeyboardEvent) {
    const step = 0.02;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      editorFraction = Math.max(0.15, editorFraction - step);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      editorFraction = Math.min(0.85, editorFraction + step);
    }
  }
</script>

<svelte:window onkeydown={handleConsoleShortcut} />

<div class="workspace">
  <div class="console-tabs" role="tablist" aria-label="Consolas SQL">
    {#each consoles as item (item.id)}
      <div
        class="console-tab"
        class:active={item.id === activeId}
        role="tab"
        tabindex="0"
        aria-selected={item.id === activeId}
        onclick={() => activateQueryConsole(profileId, item.id)}
        oncontextmenu={(event) => openTabMenu(event, item.id)}
        onkeydown={(event) => {
          if (event.key === "Enter" || event.key === " ") activateQueryConsole(profileId, item.id);
        }}
        animate:flip={{ duration: 150 }}
        in:fly={{ x: -8, duration: 150 }}
        out:fade={{ duration: 120 }}
      >
        {#if renamingId === item.id}
          <input
            class="rename-input"
            aria-label="Nombre de la consola"
            bind:this={renameInput}
            bind:value={renameValue}
            onclick={(event) => event.stopPropagation()}
            onkeydown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") finishRename(true);
              if (event.key === "Escape") finishRename(false);
            }}
            onblur={() => finishRename(true)}
          />
        {:else}
          <span>{item.title}</span>
        {/if}
        <button
          type="button"
          class="close-tab"
          aria-label={`Cerrar ${item.title}`}
          onclick={(event) => closeConsole(event, item.id)}
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>
    {/each}
    <button
      type="button"
      class="new-console"
      title={`Nueva consola (${shortcutKeys("new-query-console")})`}
      aria-label="Nueva consola SQL"
      onclick={() => createQueryConsole(profileId)}
    >
      <Plus size={14} aria-hidden="true" />
    </button>
  </div>
  <section class="workspace-body" bind:this={workspaceBody}>
    <div class="editor-pane" style={`flex-basis: ${editorFraction * 100}%`}>
      {#if activeConsole}
        {#key activeConsole.id}
          <SqlEditor
            value={activeConsole.sql}
            onchange={(sql) => updateQueryConsoleSql(activeConsole.id, sql)}
            onexecute={(sql) => requestExecution(activeConsole.id, sql)}
            executing={execution.isExecuting}
            onopentabledefinition={(ref) => (tableDefinitionRequest = ref)}
          />
        {/key}
      {/if}
    </div>
    {#if execution.pendingConfirmation && activeConsole}
      <ExecutionGuard
        statement={execution.pendingConfirmation.statement}
        oncancel={() => cancelPendingExecution(activeConsole.id)}
        onconfirm={() => confirmPendingExecution(activeConsole.id)}
      />
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="splitter"
      role="separator"
      aria-orientation="horizontal"
      aria-valuenow={Math.round(editorFraction * 100)}
      aria-valuemin={15}
      aria-valuemax={85}
      tabindex="0"
      onpointerdown={startResize}
      onkeydown={onSplitterKeydown}
    ></div>
    <div class="result-region">
      <ResultPane
        isExecuting={execution.isExecuting}
        result={execution.result}
        sourceLabel={resultSourceLabel}
        columnCatalogInfo={resultColumnCatalogInfo}
      />
    </div>
  </section>
</div>

{#if tableDefinitionRequest}
  <TableDefinitionModal
    dataSource={dataSourceLabel}
    schema={tableDefinitionRequest.schema}
    table={tableDefinitionRequest.table}
    onclose={() => (tableDefinitionRequest = null)}
  />
{/if}

{#if tabMenu}
  <ContextMenu
    x={tabMenu.x}
    y={tabMenu.y}
    items={tabMenuItems}
    onclose={() => (tabMenu = null)}
  />
{/if}

<dialog
  class="close-console-dialog"
  bind:this={closeDialog}
  oncancel={(event) => {
    event.preventDefault();
    cancelClose();
  }}
  onclose={() => (pendingCloseId = null)}
>
  <div class="dialog-heading">
    <h2>Cerrar {pendingCloseConsole?.title ?? "consola"}</h2>
    <button type="button" class="dialog-close" aria-label="Cerrar" onclick={cancelClose}>
      <X size={15} aria-hidden="true" />
    </button>
  </div>
  <p>
    Lo que escribiste en esta consola no está guardado en un archivo SQL. Si la cierras,
    se eliminarán la consola temporal y todo su contenido.
  </p>
  <div class="dialog-actions">
    <button type="button" class="secondary-action" onclick={cancelClose}>Cancelar</button>
    <button type="button" class="danger-action" onclick={confirmClose}>Cerrar consola</button>
  </div>
</dialog>

<style>
  .workspace {
    display: flex;
    min-height: 0;
    height: 100%;
    flex-direction: column;
  }

  .console-tabs {
    display: flex;
    min-width: 0;
    min-height: 2.25rem;
    flex-shrink: 0;
    align-items: center;
    gap: var(--space-1);
    overflow-x: auto;
    padding: var(--space-1) var(--space-2);
    box-sizing: border-box;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .console-tab,
  .new-console {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-height: 1.75rem;
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    color: var(--text-secondary);
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .console-tab {
    gap: var(--space-2);
    min-width: 7rem;
    padding: 0 var(--space-2) 0 var(--space-3);
  }

  .console-tab:hover,
  .new-console:hover {
    background: var(--surface-elevated);
    color: var(--text-primary);
  }

  .console-tab.active {
    border-color: color-mix(in srgb, var(--accent) 72%, var(--border));
    background: color-mix(in srgb, var(--accent) 18%, var(--surface-elevated));
    color: var(--text-primary);
  }

  .console-tab:focus-visible,
  .new-console:focus-visible,
  .close-tab:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: -2px;
  }

  .close-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .rename-input {
    width: 7rem;
    min-width: 0;
    padding: 2px var(--space-1);
    border: 1px solid var(--focus-ring);
    border-radius: calc(var(--radius-sm) - 2px);
    outline: none;
    background: var(--surface);
    color: var(--text-primary);
    font: inherit;
  }

  .close-tab:hover {
    background: var(--surface);
  }

  .new-console {
    width: 1.75rem;
    background: transparent;
  }

  .workspace-body {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .editor-pane {
    min-height: 0;
    flex-shrink: 0;
    overflow: hidden;
  }

  /* Una franja de 6px para agarrar comodo con el mouse, pero solo pinta una
     linea de 1px centrada adentro (no un bloque con borde arriba y abajo:
     dos lineas a 4px de distancia se leen como una "linea doblada", no
     como una barra). El resto de la franja es hit-area invisible. */
  .splitter {
    position: relative;
    flex-shrink: 0;
    height: 6px;
    background: transparent;
    cursor: row-resize;
    touch-action: none;
  }

  .splitter::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border);
    transform: translateY(-50%);
  }

  .splitter:hover::after,
  .splitter:focus-visible::after {
    background: var(--accent);
  }

  .splitter:focus-visible {
    outline: none;
  }

  .result-region {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .close-console-dialog {
    width: min(27rem, calc(100vw - 2rem));
    padding: var(--space-5);
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
    color: var(--text-primary);
  }

  .dialog-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  h2 {
    margin: 0;
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
  }

  .dialog-heading + p {
    margin: var(--space-3) 0 var(--space-5);
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .dialog-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1);
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .dialog-close:hover {
    background: var(--surface);
    color: var(--text-primary);
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .dialog-actions button {
    min-height: 2rem;
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .secondary-action {
    background: var(--surface);
    color: var(--text-primary);
  }

  .danger-action {
    border-color: var(--danger) !important;
    background: var(--danger);
    color: var(--text-on-accent);
  }

  .dialog-actions button:focus-visible,
  .dialog-close:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
</style>
