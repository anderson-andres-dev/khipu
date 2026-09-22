<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import "$lib/styles/tokens.css";
  import { connection } from "$lib/stores/connection";
  import { initThemeEffects } from "$lib/theming/theme";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { Minus, Settings, Square, X } from "@lucide/svelte";
  import SettingsPanel from "$lib/components/SettingsPanel.svelte";

  let cleanupThemeEffects: (() => void) | undefined;
  let settingsOpen = $state(false);
  let { children }: { children: Snippet } = $props();
  const appWindow = getCurrentWindow();

  onMount(() => {
    cleanupThemeEffects = initThemeEffects();
  });

  onDestroy(() => {
    cleanupThemeEffects?.();
  });
</script>

<div class="shell">
  <header class="topbar">
    {#if $connection.connected}
      <span class="pill">{$connection.tableCount} tablas cargadas</span>
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

  <aside class="sidebar" aria-hidden="true"></aside>

  <main class="main">
    <div class="route-content" hidden={settingsOpen} inert={settingsOpen}>
      {@render children()}
    </div>
    {#if settingsOpen}
      <SettingsPanel onclose={() => (settingsOpen = false)} />
    {/if}
  </main>
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

  .pill {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 0.75rem;
    letter-spacing: var(--tracking-body);
    line-height: var(--leading-body);
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
