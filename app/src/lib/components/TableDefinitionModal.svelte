<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { EditorView } from "codemirror";
  import { EditorState } from "@codemirror/state";
  import { sql, MySQL } from "@codemirror/lang-sql";
  import { X } from "@lucide/svelte";
  import { t } from "$lib/i18n";
  import { fetchTableDefinition } from "$lib/tableDefinition";
  import { buildCmTheme } from "$lib/theming/codemirrorTheme";
  import { editorPalette, effectiveScheme } from "$lib/theming/theme";

  let {
    dataSource,
    schema,
    table,
    onclose,
  }: {
    dataSource: string;
    schema: string;
    table: string;
    onclose: () => void;
  } = $props();

  let dialogEl = $state<HTMLDialogElement>();
  let ddlContainer = $state<HTMLDivElement>();
  let ddlView: EditorView | undefined;
  let status = $state<"loading" | "ok" | "error">("loading");
  let ddl = $state("");
  let errorMessage = $state("");

  onMount(() => {
    dialogEl?.showModal();
    void load();
    return () => ddlView?.destroy();
  });

  // MySQL cita CADA identificador entre backticks ("`oltd_codi`"), que es
  // correcto pero se lee ruidoso para una vista de solo lectura - DataGrip
  // tampoco los muestra en su popup de estructura. Postgres nunca los usa,
  // asi que esto no le hace nada.
  function cleanDdl(raw: string): string {
    return raw.replace(/`/g, "");
  }

  // ddlContainer solo existe una vez que Svelte pinta la rama {:else} (tras
  // status pasar a "ok"); un effect que dependa de los dos re-corre apenas
  // el contenedor aparece, en vez de intentar montar el editor antes de que
  // el div exista en el DOM.
  $effect(() => {
    if (status !== "ok" || !ddlContainer) return;
    ddlView?.destroy();
    ddlView = new EditorView({
      doc: cleanDdl(ddl),
      parent: ddlContainer,
      extensions: [
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        sql({ dialect: MySQL }),
        buildCmTheme(get(editorPalette), get(effectiveScheme)),
        EditorView.lineWrapping,
      ],
    });
  });

  async function load() {
    status = "loading";
    const result = await fetchTableDefinition(schema, table);
    if (result.ok) {
      ddl = result.ddl;
      status = "ok";
    } else {
      errorMessage = result.message;
      status = "error";
    }
  }
</script>

<dialog
  class="table-definition-modal"
  bind:this={dialogEl}
  onclose={onclose}
  oncancel={(event) => {
    event.preventDefault();
    dialogEl?.close();
  }}
>
  <div class="dialog-heading">
    <h2>{table}</h2>
    <button type="button" class="dialog-close" aria-label={$t("common.close")} onclick={() => dialogEl?.close()}>
      <X size={15} aria-hidden="true" />
    </button>
  </div>
  <dl class="meta">
    <div class="meta-row">
      <dt>{$t("workspace.definition.dataSource")}</dt>
      <dd>{dataSource}</dd>
    </div>
    <div class="meta-row">
      <dt>{$t("workspace.definition.schema")}</dt>
      <dd>{schema}</dd>
    </div>
    <div class="meta-row">
      <dt>{$t("workspace.definition.table")}</dt>
      <dd>{table}</dd>
    </div>
  </dl>
  <div class="ddl-region">
    {#if status === "loading"}
      <p class="placeholder">{$t("workspace.definition.loading")}</p>
    {:else if status === "error"}
      <p class="error">{errorMessage}</p>
    {:else}
      <div class="ddl" bind:this={ddlContainer}></div>
    {/if}
  </div>
</dialog>

<style>
  /* Centrado en ambos ejes gratis: la hoja de estilos por defecto de
     <dialog> ya pone inset:0 + margin:auto cuando se abre con showModal();
     tokens.css solo le suma transiciones de entrada/salida, no toca
     posicion, asi que no hace falta reimplementar el centrado a mano. */
  .table-definition-modal {
    display: flex;
    width: min(38rem, calc(100vw - 2rem));
    max-height: min(32rem, calc(100vh - 4rem));
    flex-direction: column;
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
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  h2 {
    margin: 0;
    overflow: hidden;
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dialog-close {
    display: inline-flex;
    flex-shrink: 0;
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

  .dialog-close:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .meta {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    gap: 2px;
    margin: var(--space-4) 0 0;
    font-size: 0.8125rem;
  }

  .meta-row {
    display: flex;
    gap: var(--space-2);
  }

  .meta dt {
    flex-shrink: 0;
    width: 7rem;
    color: var(--text-secondary);
  }

  .meta dd {
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ddl-region {
    min-height: 0;
    margin-top: var(--space-4);
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-content);
  }

  .placeholder,
  .error {
    margin: 0;
    padding: var(--space-3);
    font-size: 0.8125rem;
  }

  .placeholder {
    color: var(--text-secondary);
  }

  .error {
    color: var(--danger);
  }

  .ddl {
    min-height: 0;
  }

  .ddl :global(.cm-editor) {
    font-size: 0.8125rem;
  }

  .ddl :global(.cm-scroller) {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
    line-height: 1.5;
  }

  .ddl :global(.cm-content) {
    padding: var(--space-3);
  }

  .ddl :global(.cm-gutters) {
    display: none;
  }
</style>
