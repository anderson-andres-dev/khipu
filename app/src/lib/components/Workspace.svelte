<script lang="ts">
  import { tick } from "svelte";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
  import { Plus, X } from "@lucide/svelte";
  import SqlEditor from "$lib/SqlEditor.svelte";
  import ContextMenu from "$lib/components/ContextMenu.svelte";
  import type { ContextMenuItem } from "$lib/contextMenu";
  import { connection } from "$lib/stores/connection";
  import { eventMatchesShortcut, shortcuts } from "$lib/stores/shortcuts";
  import {
    activateQueryConsole,
    closeQueryConsole,
    createQueryConsole,
    ensureQueryConsole,
    queryConsoles,
    renameQueryConsole,
    updateQueryConsoleSql,
  } from "$lib/stores/queryConsoles";

  const profileId = $derived($connection.profileId ?? "default");
  const consoles = $derived($queryConsoles.consoles.filter((item) => item.profileId === profileId));
  const activeId = $derived($queryConsoles.activeByProfile[profileId]);
  const activeConsole = $derived(consoles.find((item) => item.id === activeId));
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
  <section class="editor">
    {#if activeConsole}
      {#key activeConsole.id}
        <SqlEditor
          value={activeConsole.sql}
          onchange={(sql) => updateQueryConsoleSql(activeConsole.id, sql)}
        />
      {/key}
    {/if}
  </section>
</div>

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

  .editor {
    min-height: 0;
    flex: 1;
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
