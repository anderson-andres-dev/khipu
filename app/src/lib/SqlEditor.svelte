<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { basicSetup, EditorView } from "codemirror";
  import { sql } from "@codemirror/lang-sql";
  import { syntaxTree } from "@codemirror/language";
  import { autocompletion, moveCompletionSelection } from "@codemirror/autocomplete";
  import { selectAll } from "@codemirror/commands";
  import { keymap } from "@codemirror/view";
  import { Compartment, EditorSelection, Prec } from "@codemirror/state";
  import { buildCmTheme } from "$lib/theming/codemirrorTheme";
  import { editorPalette, effectiveScheme } from "$lib/theming/theme";
  import { catalogTables, connection } from "$lib/stores/connection";
  import { connectionProfiles } from "$lib/stores/connectionProfiles";
  import type { ConnectionDriver } from "$lib/connections";
  import { buildCompletionSource, buildSqlSchema, dialectFor, extractDefaultTable } from "$lib/sqlSchema";
  import { shortcuts, toCodeMirrorKey } from "$lib/stores/shortcuts";
  import { editorSettings } from "$lib/stores/editorSettings";
  import { formatSqlBlock } from "$lib/sqlFormatter";
  import { activeStatementHighlight, autoUppercaseSqlKeywords } from "$lib/sqlEditorBehavior";
  import ContextMenu from "$lib/components/ContextMenu.svelte";
  import type { ContextMenuItem } from "$lib/contextMenu";
  import "$lib/sqlEditorIcons.css";

  let { value = $bindable(""), onchange }: { value?: string; onchange?: (sql: string) => void } = $props();

  let container: HTMLDivElement;
  let view: EditorView | undefined;
  const themeCompartment = new Compartment();
  const sqlCompartment = new Compartment();
  const completionCompartment = new Compartment();
  const keymapCompartment = new Compartment();
  const behaviorCompartment = new Compartment();
  const tabCompletionCompartment = new Compartment();

  // Config vigente. schema/dialect/fkIndex cambian poco (catalogo o conexion
  // activa); defaultTable cambia con cada tecla, asi que se separan para no
  // reconstruir el SQLNamespace completo en cada keystroke.
  let sqlSchema: ReturnType<typeof buildSqlSchema> = { schema: {}, fkIndex: new Map() };
  let sqlDialect = dialectFor("mysql");
  let driver: ConnectionDriver = "mysql";
  let defaultTable: string | undefined;
  let contextMenu = $state<{ x: number; y: number; hasSelection: boolean } | null>(null);

  const contextMenuItems = $derived.by((): ContextMenuItem[] => [
    { label: "Cortar", shortcut: "Ctrl+X", disabled: !contextMenu?.hasSelection, action: cutSelection },
    { label: "Copiar", shortcut: "Ctrl+C", disabled: !contextMenu?.hasSelection, action: copySelection },
    { label: "Pegar", shortcut: "Ctrl+V", action: pasteClipboard },
    { label: "Seleccionar todo", shortcut: "Ctrl+A", separatorBefore: true, action: selectEverything },
    {
      label: "Formatear SQL",
      shortcut: $shortcuts.find((shortcut) => shortcut.id === "format-sql")?.keys,
      separatorBefore: true,
      action: () => {
        formatCurrentSql();
      },
    },
  ]);

  function openContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new Event("khipu:context-menu"));
    view?.focus();
    const selection = view?.state.selection.main;
    contextMenu = {
      x: event.clientX,
      y: event.clientY,
      hasSelection: !!selection && !selection.empty,
    };
  }

  async function writeClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      view?.focus();
      return copied;
    }
  }

  async function copySelection() {
    if (!view) return;
    const selection = view.state.selection.main;
    if (selection.empty) return;
    await writeClipboard(view.state.sliceDoc(selection.from, selection.to));
  }

  async function cutSelection() {
    if (!view) return;
    const selection = view.state.selection.main;
    if (selection.empty) return;
    const copied = await writeClipboard(view.state.sliceDoc(selection.from, selection.to));
    if (copied) view.dispatch({ changes: { from: selection.from, to: selection.to } });
    view.focus();
  }

  async function pasteClipboard() {
    if (!view) return;
    try {
      const text = await navigator.clipboard.readText();
      view.dispatch(view.state.replaceSelection(text));
      view.focus();
    } catch {
      // El permiso del portapapeles puede estar bloqueado por el sistema.
    }
  }

  function selectEverything() {
    if (!view) return;
    selectAll(view);
    view.focus();
  }

  function currentSqlRange(): { from: number; to: number; selected: boolean } | null {
    if (!view) return null;
    const selection = view.state.selection.main;
    if (!selection.empty) return { from: selection.from, to: selection.to, selected: true };

    let node = syntaxTree(view.state).resolveInner(selection.head, -1);
    while (node.parent && node.name !== "Statement") node = node.parent;
    if (node.name === "Statement") return { from: node.from, to: node.to, selected: false };

    return { from: 0, to: view.state.doc.length, selected: false };
  }

  function mappedCursorOffset(source: string, offset: number, formatted: string): number {
    const significantBeforeCursor = [...source.slice(0, offset)].filter((char) => !/\s/.test(char)).length;
    if (significantBeforeCursor === 0) return 0;

    let seen = 0;
    for (let index = 0; index < formatted.length; index += 1) {
      if (!/\s/.test(formatted[index])) seen += 1;
      if (seen === significantBeforeCursor) return index + 1;
    }
    return formatted.length;
  }

  function formatCurrentSql(): boolean {
    if (!view) return false;
    const range = currentSqlRange();
    if (!range) return false;

    const originalDoc = view.state.doc;
    const source = view.state.sliceDoc(range.from, range.to);
    const originalCursor = view.state.selection.main.head;
    void formatSqlBlock(source, driver, get(editorSettings).formatterLineWidth).then((formatted) => {
      // La primera ejecución carga el formateador bajo demanda. Si el usuario
      // escribió durante esos milisegundos, no se reemplaza una versión vieja.
      if (!view || view.state.doc !== originalDoc) return;
      if (formatted === source) {
        view.focus();
        return;
      }

      const cursorOffset = mappedCursorOffset(source, originalCursor - range.from, formatted);
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: formatted },
        selection: range.selected
          ? EditorSelection.range(range.from, range.from + formatted.length)
          : EditorSelection.cursor(range.from + cursorOffset),
        userEvent: "input.format",
      });
      view.focus();
    });
    return true;
  }

  // El keymap por defecto de basicSetup ya deberia traer Mod-a -> selectAll,
  // pero en este webview no estaba disparando de forma confiable; se arma
  // explicito con Prec.highest para que gane sobre cualquier otro keymap, y
  // se reconfigura si el atajo se reasigna en Ajustes > Atajos.
  function buildEditorKeymap() {
    const selectAllShortcut = get(shortcuts).find((shortcut) => shortcut.id === "select-all");
    const formatShortcut = get(shortcuts).find((shortcut) => shortcut.id === "format-sql");
    const bindings = [];
    if (selectAllShortcut) {
      bindings.push({ key: toCodeMirrorKey(selectAllShortcut.keys), run: selectAll, preventDefault: true });
    }
    if (formatShortcut) {
      bindings.push({ key: toCodeMirrorKey(formatShortcut.keys), run: formatCurrentSql, preventDefault: true });
    }

    return Prec.highest(keymap.of(bindings));
  }

  // moveCompletionSelection() es un no-op (devuelve false) si el tooltip de
  // autocompletado no esta abierto, asi que Tab/Shift-Tab caen al
  // comportamiento normal (salir del editor) el resto del tiempo - esto solo
  // intercepta la tecla mientras hay sugerencias visibles.
  function buildTabCompletionKeymap(enabled: boolean) {
    if (!enabled) return [];
    return Prec.highest(
      keymap.of([{ key: "Tab", run: moveCompletionSelection(true), shift: moveCompletionSelection(false) }]),
    );
  }

  function reconfigureCompletion() {
    if (!view) return;
    view.dispatch({
      effects: [
        sqlCompartment.reconfigure(sql({ dialect: sqlDialect, upperCaseKeywords: true })),
        completionCompartment.reconfigure(
          autocompletion({
            override: [
              buildCompletionSource({
                dialect: sqlDialect,
                driver,
                schema: sqlSchema.schema,
                defaultSchema: sqlSchema.defaultSchema,
                defaultTable,
                fkIndex: sqlSchema.fkIndex,
              }),
            ],
          }),
        ),
      ],
    });
  }

  onMount(() => {
    view = new EditorView({
      doc: value,
      parent: container,
      extensions: [
        basicSetup,
        sqlCompartment.of(sql({ dialect: sqlDialect, upperCaseKeywords: true })),
        completionCompartment.of(autocompletion()),
        keymapCompartment.of(buildEditorKeymap()),
        tabCompletionCompartment.of(buildTabCompletionKeymap(get(editorSettings).tabNavigatesCompletion)),
        activeStatementHighlight,
        behaviorCompartment.of(get(editorSettings).autoUppercaseKeywords ? autoUppercaseSqlKeywords : []),
        themeCompartment.of(buildCmTheme(get(editorPalette), get(effectiveScheme))),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;

          value = update.state.doc.toString();
          onchange?.(value);

          // completeFromSchema (la libreria) no distingue clausulas SQL: sin
          // "alias." de por medio, siempre sugiere tablas, sea que estes
          // despues de FROM o de WHERE. Detectar la tabla del FROM actual y
          // pasarla como defaultTable hace que sus columnas tambien aparezcan
          // sin calificar (ver comentario largo en sqlSchema.ts).
          const nextDefaultTable = extractDefaultTable(value, update.state.selection.main.head);
          if (nextDefaultTable !== defaultTable) {
            defaultTable = nextDefaultTable;
            // Reconfigurar el compartment desde dentro del propio
            // updateListener reentraria en el dispatch en curso; se difiere
            // al siguiente microtask.
            queueMicrotask(reconfigureCompletion);
          }
        }),
      ],
    });
  });

  $effect(() => {
    const palette = $editorPalette;
    const scheme = $effectiveScheme;
    if (!view) return;
    view.dispatch({ effects: themeCompartment.reconfigure(buildCmTheme(palette, scheme)) });
  });

  $effect(() => {
    $shortcuts;
    if (!view) return;
    view.dispatch({ effects: keymapCompartment.reconfigure(buildEditorKeymap()) });
  });

  $effect(() => {
    const autoUppercase = $editorSettings.autoUppercaseKeywords;
    if (!view) return;
    view.dispatch({
      effects: behaviorCompartment.reconfigure(autoUppercase ? autoUppercaseSqlKeywords : []),
    });
  });

  $effect(() => {
    const tabNavigatesCompletion = $editorSettings.tabNavigatesCompletion;
    if (!view) return;
    view.dispatch({
      effects: tabCompletionCompartment.reconfigure(buildTabCompletionKeymap(tabNavigatesCompletion)),
    });
  });

  // Reconfigura schema/dialecto/FK cuando cambia el catalogo o la conexion
  // activa (ver arriba para el resto de la reconfiguracion, atada al texto).
  $effect(() => {
    const tables = $catalogTables;
    const profile = $connectionProfiles.find((candidate) => candidate.id === $connection.profileId);

    sqlSchema = buildSqlSchema(tables);
    driver = profile?.driver ?? "mysql";
    sqlDialect = dialectFor(driver);
    reconfigureCompletion();
  });

  onDestroy(() => view?.destroy());
</script>

<div
  class="sql-editor"
  role="group"
  aria-label="Editor SQL"
  bind:this={container}
  oncontextmenu={openContextMenu}
></div>

{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    items={contextMenuItems}
    onclose={() => (contextMenu = null)}
  />
{/if}

<style>
  .sql-editor {
    text-align: left;
    height: 100%;
  }

  .sql-editor :global(.cm-editor) {
    height: 100%;
    font-size: 14px;
  }
</style>
