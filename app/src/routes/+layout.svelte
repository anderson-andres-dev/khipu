<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import "$lib/styles/tokens.css";
  import { connection, catalogTables, connectToProfile, pendingEdit, reset } from "$lib/stores/connection";
  import { connectionProfiles } from "$lib/stores/connectionProfiles";
  import { eventMatchesShortcut, shortcuts } from "$lib/stores/shortcuts";
  import { initThemeEffects } from "$lib/theming/theme";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import {
    ArrowLeft,
    Minus,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    Square,
    X,
  } from "@lucide/svelte";
  import SettingsPanel from "$lib/components/SettingsPanel.svelte";
  import SchemaTree from "$lib/components/SchemaTree.svelte";
  import ConnectionSwitcher from "$lib/components/ConnectionSwitcher.svelte";

  let cleanupThemeEffects: (() => void) | undefined;
  let settingsOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let refreshingTables = $state(false);
  let { children }: { children: Snippet } = $props();
  const appWindow = getCurrentWindow();

  // "Recargar tablas" es, en la practica, volver a conectar al mismo
  // perfil activo: no hay pool vivo que reintrospectar (ver comentario de
  // reset() en connection.ts), asi que connectToProfile ya hace exactamente
  // lo que un refresh necesita, sin agregar ningun comando nuevo en Rust.
  async function handleRefreshTables() {
    const profile = $connectionProfiles.find((candidate) => candidate.id === $connection.profileId);
    if (!profile || refreshingTables) return;

    refreshingTables = true;
    const result = await connectToProfile(profile);
    refreshingTables = false;

    if (!result.ok) {
      pendingEdit.set({ profile, error: result.reason === "connect-failed" ? result.error : null });
    }
  }

  // Atajos globales resueltos desde Ajustes > Atajos (shortcuts.ts). Se
  // desactivan mientras el modal de Ajustes esta abierto, porque ahi mismo
  // se pueden estar capturando nuevas combinaciones.
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (settingsOpen) return;

    const toggleSidebar = $shortcuts.find((shortcut) => shortcut.id === "toggle-sidebar");
    if (toggleSidebar && eventMatchesShortcut(event, toggleSidebar.keys)) {
      if (!$connection.connected) return;
      event.preventDefault();
      sidebarCollapsed = !sidebarCollapsed;
    }
  }

  onMount(() => {
    cleanupThemeEffects = initThemeEffects();
    document.addEventListener("keydown", handleGlobalKeydown);
  });

  onDestroy(() => {
    cleanupThemeEffects?.();
    document.removeEventListener("keydown", handleGlobalKeydown);
  });
</script>

<div class="shell" class:with-sidebar={$connection.connected}>
  <header class="topbar">
    {#if $connection.connected}
      <button
        class="icon-button"
        type="button"
        title={sidebarCollapsed ? "Mostrar panel de tablas" : "Ocultar panel de tablas"}
        aria-label={sidebarCollapsed ? "Mostrar panel de tablas" : "Ocultar panel de tablas"}
        aria-pressed={!sidebarCollapsed}
        onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
      >
        {#if sidebarCollapsed}
          <PanelLeftOpen size={16} aria-hidden="true" />
        {:else}
          <PanelLeftClose size={16} aria-hidden="true" />
        {/if}
      </button>
      <div class="connection-nav">
        <button
          class="icon-button"
          type="button"
          title="Volver a conexiones"
          aria-label="Volver a conexiones"
          disabled={$connection.connecting}
          onclick={reset}
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <ConnectionSwitcher
          profiles={$connectionProfiles}
          activeProfileId={$connection.profileId}
          disabled={$connection.connecting}
        />
      </div>
    {/if}
    <div class="drag-region" data-tauri-drag-region></div>
    <button
      class="icon-button"
      type="button"
      title="Ajustes"
      aria-label={settingsOpen ? "Cerrar ajustes" : "Abrir ajustes"}
      aria-expanded={settingsOpen}
      aria-pressed={settingsOpen}
      onclick={() => (settingsOpen = !settingsOpen)}
    >
      <Settings size={17} aria-hidden="true" />
    </button>
    <div class="window-controls" aria-label="Controles de ventana">
      <button
        type="button"
        title="Minimizar"
        aria-label="Minimizar"
        onclick={() => appWindow.minimize()}
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <button
        type="button"
        title="Maximizar o restaurar"
        aria-label="Maximizar o restaurar"
        onclick={() => appWindow.toggleMaximize()}
      >
        <Square size={12} aria-hidden="true" />
      </button>
      <button
        class="close-window"
        type="button"
        title="Cerrar"
        aria-label="Cerrar"
        onclick={() => appWindow.close()}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  </header>

  <aside
    class="sidebar"
    class:collapsed={sidebarCollapsed}
    aria-hidden={!$connection.connected || sidebarCollapsed}
  >
    {#if $connection.connected}
      <SchemaTree
        tables={$catalogTables}
        refreshing={refreshingTables}
        onrefresh={handleRefreshTables}
      />
    {/if}
  </aside>

  <main class="main">
    <div class="route-content">
      {@render children()}
    </div>
  </main>

  {#if settingsOpen}
    <SettingsPanel onclose={() => (settingsOpen = false)} />
  {/if}
</div>

<style>
  :global(html, body) {
    margin: 0;
    height: 100%;
    overflow: hidden;
    background: var(--surface);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
  }

  .shell {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-areas: "topbar topbar" "sidebar main";
    grid-template-rows: auto 1fr;
    grid-template-columns: 0 minmax(0, 1fr);
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--surface);
  }

  .shell.with-sidebar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .topbar {
    grid-area: topbar;
    display: flex;
    align-items: center;
    min-height: 2.625rem;
    box-sizing: border-box;
    gap: var(--space-3);
    padding: var(--space-1) var(--space-3);
    border-bottom: 1px solid var(--border);
    background: var(--topbar-background);
  }

  .connection-nav {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .drag-region {
    align-self: stretch;
    flex: 1;
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      color var(--duration-fast),
      background-color var(--duration-fast),
      border-color var(--duration-fast);
  }

  .icon-button:hover {
    color: var(--text-primary);
    background: var(--surface-elevated);
    border-color: var(--border);
  }

  .icon-button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .icon-button:disabled {
    color: var(--control-disabled);
    cursor: not-allowed;
  }

  .icon-button:disabled:hover {
    background: transparent;
    border-color: transparent;
  }

  .window-controls {
    display: flex;
    align-self: stretch;
    margin: calc(var(--space-1) * -1) calc(var(--space-3) * -1) calc(var(--space-1) * -1) 0;
  }

  .window-controls button {
    display: inline-flex;
    width: 2.5rem;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .window-controls button:hover {
    background: var(--surface-elevated);
    color: var(--text-primary);
  }

  .window-controls .close-window:hover {
    background: var(--danger);
    color: var(--text-on-accent);
  }

  .window-controls button:focus-visible {
    z-index: 1;
    outline: 2px solid var(--focus-ring);
    outline-offset: -2px;
  }

  .sidebar {
    grid-area: sidebar;
    overflow: hidden;
    min-width: 0;
    min-height: 0;
    border-right: 1px solid transparent;
    transition:
      width var(--duration-fast) ease,
      border-color var(--duration-fast) ease;
  }

  .shell.with-sidebar .sidebar {
    width: 220px;
    border-right-color: var(--border);
  }

  .shell.with-sidebar .sidebar.collapsed {
    width: 0;
    border-right-color: transparent;
  }

  .main {
    grid-area: main;
    overflow: hidden;
    min-width: 0;
    min-height: 0;
  }

  .route-content {
    height: 100%;
    min-height: 0;
  }
</style>
