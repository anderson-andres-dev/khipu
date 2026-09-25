<script lang="ts">
  import { tick } from "svelte";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
  import { FileCode, Plus, SquareTerminal, TriangleAlert, X } from "@lucide/svelte";
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
    isQueryConsoleDirty,
    queryConsoles,
    renameQueryConsole,
    requireQueryConfirmation,
    takeQueryConfirmation,
    updateQueryConsoleSql,
  } from "$lib/stores/queryConsoles";
  import { openSqlFileWithDialog, renameConsoleFile, saveConsole, saveConsoleAs } from "$lib/sqlFiles";
  import { dismissNotice, notice, notifyError } from "$lib/stores/notifications";

  const profileId = $derived($connection.profileId ?? "default");
  const consoles = $derived($queryConsoles.consoles.filter((item) => item.profileId === profileId));
  const activeId = $derived($queryConsoles.activeByProfile[profileId]);
  const activeConsole = $derived(consoles.find((item) => item.id === activeId));
  const execution = $derived(
    activeConsole
      ? executionForConsole($queryConsoles, activeConsole.id)
      : { isExecuting: false, result: null, resultSql: null, resultAt: null, pendingConfirmation: null },
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
        label: "Guardar",
        shortcut: shortcutKeys("save-query-console"),
        separatorBefore: true,
        action: () => void runFileAction(() => saveConsole(item)),
      },
      {
        label: "Guardar como…",
        shortcut: shortcutKeys("save-query-console-as"),
        action: () => void runFileAction(() => saveConsoleAs(item)),
      },
      {
        label: item.filePath ? "Cerrar archivo" : "Cerrar consola",
        shortcut: shortcutKeys("close-query-console"),
        separatorBefore: true,
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
      {
        label: "Abrir archivo…",
        shortcut: shortcutKeys("open-sql-file"),
        action: () => void runFileAction(() => openSqlFileWithDialog(profileId)),
      },
    ];
  });

  // Las acciones de archivo (dialogos + disco) son asincronas y pueden
  // fallar por permisos, disco lleno, etc.: el error se muestra como aviso
  // en vez de perderse en la consola del navegador.
  async function runFileAction(action: () => Promise<boolean | void>): Promise<boolean> {
    try {
      return (await action()) !== false;
    } catch (error) {
      notifyError(error);
      return false;
    }
  }

  function currentConsole(id: string) {
    return $queryConsoles.consoles.find((item) => item.id === id);
  }

  $effect(() => {
    ensureQueryConsole(profileId);
  });

  // --- Desborde de la barra de pestañas -----------------------------------
  // Las pestañas scrollean por debajo del boton "+" (que queda fijo a la
  // derecha); un desvanecido en cada borde con contenido oculto sugiere que
  // hay mas pestañas de ese lado.
  let tabsScroll = $state<HTMLDivElement>();
  let tabsOverflow = $state({ start: false, end: false });

  function updateTabsOverflow() {
    const el = tabsScroll;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    if (start !== tabsOverflow.start || end !== tabsOverflow.end) tabsOverflow = { start, end };
  }

  // La rueda vertical del mouse desplaza la barra en horizontal.
  function onTabsWheel(event: WheelEvent) {
    const el = tabsScroll;
    if (!el || el.scrollWidth <= el.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    el.scrollLeft += event.deltaY;
  }

  $effect(() => {
    const el = tabsScroll;
    if (!el) return;
    const observer = new ResizeObserver(updateTabsOverflow);
    observer.observe(el);
    // No pasivo a proposito: preventDefault evita que la rueda scrollee
    // tambien la pagina.
    el.addEventListener("wheel", onTabsWheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", onTabsWheel);
    };
  });

  // Al activar o crear una pestaña, la barra se desliza hasta dejarla a la
  // vista: una pestaña nueva entra por la derecha y empuja a las demas.
  // Espera a que termine la animacion de entrada (fly, 150ms) para medir el
  // ancho final.
  $effect(() => {
    const id = activeId;
    consoles.length;
    const el = tabsScroll;
    if (!id || !el) return;
    const timer = setTimeout(() => {
      const tab = el.querySelector<HTMLElement>(`[data-console-id="${CSS.escape(id)}"]`);
      tab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      updateTabsOverflow();
    }, 160);
    return () => clearTimeout(timer);
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
    const id = renamingId;
    renamingId = null;
    if (!save || !id) return;
    // En un archivo, cambiar el nombre renombra el archivo en disco.
    if (currentConsole(id)?.filePath) {
      void runFileAction(() => renameConsoleFile(id, renameValue));
    } else {
      renameQueryConsole(id, renameValue);
    }
  }

  async function requestClose(id: string) {
    tabMenu = null;
    const item = consoles.find((candidate) => candidate.id === id);
    // Solo se pregunta cuando cerrar perderia algo.
    if (item && !isQueryConsoleDirty(item)) {
      closeQueryConsole(profileId, id);
      return;
    }
    pendingCloseId = id;
    await tick();
    closeDialog?.showModal();
    // El foco va al dialogo y no a un boton: asi ninguno aparece con el
    // anillo de foco al abrir y un Enter accidental no dispara nada. Esc
    // sigue cancelando y Tab entra a los botones.
    closeDialog?.focus();
  }

  function cancelClose() {
    closeDialog?.close();
    pendingCloseId = null;
  }

  function discardAndClose() {
    if (pendingCloseId) closeQueryConsole(profileId, pendingCloseId);
    closeDialog?.close();
    pendingCloseId = null;
  }

  // Guarda (con el dialogo de "Guardar como" si es una consola) y recien
  // despues cierra; si el usuario cancela el dialogo o falla el disco, la
  // pestaña queda abierta.
  async function saveAndClose() {
    const id = pendingCloseId;
    const item = id ? currentConsole(id) : undefined;
    if (!id || !item) return;
    closeDialog?.close();
    pendingCloseId = null;
    if (await runFileAction(() => saveConsole(item))) closeQueryConsole(profileId, id);
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

    const saveAsKeys = shortcutKeys("save-query-console-as");
    if (saveAsKeys && activeConsole && eventMatchesShortcut(event, saveAsKeys)) {
      event.preventDefault();
      const item = activeConsole;
      void runFileAction(() => saveConsoleAs(item));
      return;
    }

    const saveKeys = shortcutKeys("save-query-console");
    if (saveKeys && activeConsole && eventMatchesShortcut(event, saveKeys)) {
      event.preventDefault();
      const item = activeConsole;
      void runFileAction(() => saveConsole(item));
      return;
    }

    const openKeys = shortcutKeys("open-sql-file");
    if (openKeys && eventMatchesShortcut(event, openKeys)) {
      event.preventDefault();
      void runFileAction(() => openSqlFileWithDialog(profileId));
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
  <div class="console-tabs">
  <div
    class="tabs-scroll"
    class:fade-start={tabsOverflow.start}
    class:fade-end={tabsOverflow.end}
    role="tablist"
    aria-label="Consolas SQL"
    bind:this={tabsScroll}
    onscroll={updateTabsOverflow}
  >
    {#each consoles as item (item.id)}
      {@const dirty = isQueryConsoleDirty(item)}
      <div
        class="console-tab"
        data-console-id={item.id}
        class:active={item.id === activeId}
        class:dirty
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
        {#if item.filePath}
          <FileCode size={13} class="console-tab-icon" aria-hidden="true" />
        {:else}
          <SquareTerminal size={13} class="console-tab-icon" aria-hidden="true" />
        {/if}
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
          <span class="console-tab-title" title={item.filePath ?? undefined}>{item.title}</span>
        {/if}
        <button
          type="button"
          class="close-tab"
          aria-label={dirty ? `Cerrar ${item.title} (cambios sin guardar)` : `Cerrar ${item.title}`}
          title={dirty
            ? `${item.filePath ? "Cambios sin guardar" : "Sin guardar en un archivo"} (${shortcutKeys("save-query-console")} para guardar)`
            : undefined}
          onclick={(event) => closeConsole(event, item.id)}
        >
          <span class="dirty-dot" aria-hidden="true"></span>
          <X size={12} class="close-icon" aria-hidden="true" />
        </button>
      </div>
    {/each}
  </div>
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
  {#if !activeConsole}
    <div class="workspace-empty" in:fade={{ duration: 150 }}>
      <SquareTerminal size={30} strokeWidth={1.25} class="workspace-empty-icon" aria-hidden="true" />
      <div class="workspace-empty-actions">
        <button type="button" onclick={() => createQueryConsole(profileId)}>
          <span>Nueva consola</span>
          <kbd>{shortcutKeys("new-query-console")}</kbd>
        </button>
        <button type="button" onclick={() => void runFileAction(() => openSqlFileWithDialog(profileId))}>
          <span>Abrir archivo</span>
          <kbd>{shortcutKeys("open-sql-file")}</kbd>
        </button>
      </div>
    </div>
  {:else}
  <section class="workspace-body" bind:this={workspaceBody}>
    <div class="editor-pane" style={`flex-basis: ${editorFraction * 100}%`}>
      {#if activeConsole}
        {#key activeConsole.id}
          <SqlEditor
            value={activeConsole.sql}
            onchange={(sql) => updateQueryConsoleSql(activeConsole.id, sql)}
            onexecute={(sql) => requestExecution(activeConsole.id, sql)}
            executing={execution.isExecuting}
            result={execution.result}
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
        resultSql={execution.resultSql}
        resultAt={execution.resultAt}
        sourceLabel={resultSourceLabel}
        columnCatalogInfo={resultColumnCatalogInfo}
      />
    </div>
  </section>
  {/if}
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

{#if $notice}
  {@const current = $notice}
  <div class="notice" role="alert" transition:fly={{ y: 8, duration: 160 }}>
    <TriangleAlert size={14} class="notice-icon" aria-hidden="true" />
    <span>{current.message}</span>
    <button type="button" class="notice-close" aria-label="Cerrar aviso" onclick={() => dismissNotice(current.id)}>
      <X size={12} aria-hidden="true" />
    </button>
  </div>
{/if}

<dialog
  class="close-console-dialog"
  tabindex="-1"
  bind:this={closeDialog}
  oncancel={(event) => {
    event.preventDefault();
    cancelClose();
  }}
  onclose={() => (pendingCloseId = null)}
>
  <div class="dialog-icon" aria-hidden="true">
    <TriangleAlert size={24} strokeWidth={2} />
  </div>
  <h2>¿Cerrar {pendingCloseConsole?.title ?? "consola"}?</h2>
  <p class="dialog-message">Hay cambios sin guardar.</p>
  <div class="dialog-actions">
    <button type="button" class="secondary-action" onclick={cancelClose}>Cancelar</button>
    <button type="button" class="danger-action" onclick={discardAndClose}>Descartar</button>
    <button type="button" class="primary-action" onclick={() => void saveAndClose()}>Guardar</button>
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
    padding: var(--space-1) var(--space-2);
    box-sizing: border-box;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  /* El scroll es nativo (rueda, trackpad, arrastre) pero sin barra visible:
     el desvanecido de los bordes ya indica que hay mas pestañas. */
  .tabs-scroll {
    --fade: 2rem;
    display: flex;
    min-width: 0;
    flex: 0 1 auto;
    align-items: center;
    gap: var(--space-1);
    overflow-x: auto;
    scrollbar-width: none;
    scroll-padding-inline: var(--fade);
  }

  .tabs-scroll::-webkit-scrollbar {
    display: none;
  }

  .tabs-scroll.fade-end {
    mask-image: linear-gradient(to right, #000 calc(100% - var(--fade)), transparent);
  }

  .tabs-scroll.fade-start {
    mask-image: linear-gradient(to right, transparent, #000 var(--fade));
  }

  .tabs-scroll.fade-start.fade-end {
    mask-image: linear-gradient(to right, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent);
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

  /* Antes el hover repetia el fondo de reposo y no se notaba en ningun
     tema: ahora aclara/oscurece apenas hacia el color del texto. */
  .console-tab:hover,
  .new-console:hover {
    background: color-mix(in srgb, var(--surface-elevated) 92%, var(--text-primary));
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

  .console-tab :global(.console-tab-icon) {
    flex-shrink: 0;
    color: var(--text-secondary);
    opacity: 0.8;
  }

  .console-tab.active :global(.console-tab-icon) {
    color: var(--accent);
    opacity: 1;
  }

  .console-tab-title {
    white-space: nowrap;
  }

  /* Boton de cierre de tamaño fijo: la bolita de "sin guardar" y la X
     ocupan el mismo lugar, asi la pestaña no cambia de ancho al alternar.
     Con cambios pendientes se ve la bolita; al pasar el mouse por la
     pestaña (o enfocar el boton) se cambia por la X, como en los editores
     de codigo. */
  .close-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .dirty-dot {
    position: absolute;
    width: 0.4375rem;
    height: 0.4375rem;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 22%, transparent);
    opacity: 0;
    transform: scale(0.4);
    transition:
      opacity 140ms ease,
      transform 180ms cubic-bezier(0.2, 0.9, 0.3, 1.3);
  }

  .close-tab :global(.close-icon) {
    transition: opacity 120ms ease;
  }

  .console-tab.dirty .dirty-dot {
    opacity: 1;
    transform: scale(1);
  }

  .console-tab.dirty .close-tab :global(.close-icon) {
    opacity: 0;
  }

  .console-tab.dirty:hover .dirty-dot,
  .console-tab.dirty .close-tab:focus-visible .dirty-dot {
    opacity: 0;
    transform: scale(0.4);
  }

  .console-tab.dirty:hover .close-tab :global(.close-icon),
  .console-tab.dirty .close-tab:focus-visible :global(.close-icon) {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .dirty-dot,
    .close-tab :global(.close-icon) {
      transition: none;
    }
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

  /* Fijo a la derecha de las pestañas; cuando desbordan, las pestañas
     pasan por debajo del desvanecido y el boton no se mueve. */
  .console-tabs > .new-console {
    flex-shrink: 0;
  }

  /* Sin pestañas abiertas: accesos directos centrados, al estilo de la
     pantalla vacia de un editor. */
  .workspace-empty {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-5);
    background: var(--surface-content);
    user-select: none;
  }

  .workspace-empty :global(.workspace-empty-icon) {
    color: color-mix(in srgb, var(--text-secondary) 55%, transparent);
  }

  .workspace-empty-actions {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 15rem;
  }

  .workspace-empty-actions button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
    transition:
      background-color var(--duration-fast) ease,
      color var(--duration-fast) ease;
  }

  .workspace-empty-actions button:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .workspace-empty-actions button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: -2px;
  }

  .workspace-empty-actions kbd {
    color: color-mix(in srgb, var(--text-secondary) 75%, transparent);
    font: inherit;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
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

  /* Todo centrado: icono, titulo y mensaje apilados, y los tres botones
     del mismo ancho en una fila. Colores planos, sin degradados. */
  .close-console-dialog {
    width: min(25rem, calc(100vw - 2rem));
    padding: 2rem 1.75rem 1.75rem;
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
    color: var(--text-primary);
    text-align: center;
    outline: none;
  }

  .close-console-dialog[open] {
    animation: dialog-in 180ms cubic-bezier(0.2, 0.9, 0.3, 1);
  }

  @keyframes dialog-in {
    from {
      opacity: 0;
      transform: translateY(4px) scale(0.97);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .close-console-dialog[open] {
      animation: none;
    }
  }

  .dialog-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1.25rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--warning) 14%, transparent);
    color: var(--warning);
  }

  h2 {
    margin: 0;
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--tracking-heading);
    overflow-wrap: anywhere;
  }

  .dialog-message {
    margin: var(--space-2) 0 1.75rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.625rem;
  }

  .dialog-actions button {
    /* Sin borde en ninguno: con borde, el relleno de un boton "neutro"
       arranca 1px mas adentro que el de los de color y se ve mas bajo
       aunque midan lo mismo. */
    height: 2.5rem;
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color 120ms ease,
      border-color 120ms ease;
  }

  .close-console-dialog .secondary-action {
    background: color-mix(in srgb, var(--text-primary) 9%, var(--surface-elevated));
    color: var(--text-primary);
  }

  .close-console-dialog .secondary-action:hover {
    background: color-mix(in srgb, var(--text-primary) 14%, var(--surface-elevated));
  }

  /* Rojo saturado propio: --danger en los temas oscuros es un rosado
     pensado para texto y como relleno se ve lavado. */
  .danger-action {
    background: #e5484d;
    color: #fff;
  }

  .danger-action:hover {
    background: #ec5d5e;
  }

  .primary-action {
    background: var(--accent);
    color: var(--text-on-accent);
  }

  .primary-action:hover {
    background: var(--accent-hover);
  }

  .notice {
    position: fixed;
    right: var(--space-4);
    bottom: var(--space-4);
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    max-width: min(26rem, calc(100vw - 2rem));
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--danger) 35%, var(--border));
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
    color: var(--text-primary);
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  .notice :global(.notice-icon) {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--danger);
  }

  .notice span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .notice-close {
    display: inline-flex;
    flex-shrink: 0;
    padding: 2px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .notice-close:hover {
    background: var(--surface);
    color: var(--text-primary);
  }

  .dialog-actions button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
</style>
