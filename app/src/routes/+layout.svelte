<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import "$lib/styles/tokens.css";
  import { connection } from "$lib/stores/connection";
  import { initThemeEffects } from "$lib/theming/theme";
  import { Settings } from "@lucide/svelte";
  import SettingsPanel from "$lib/components/SettingsPanel.svelte";

  let cleanupThemeEffects: (() => void) | undefined;
  let settingsOpen = $state(false);

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
    <button
      class="icon-button"
      type="button"
      aria-label="Abrir ajustes"
      aria-haspopup="dialog"
      aria-expanded={settingsOpen}
      onclick={() => (settingsOpen = true)}
    >
      <Settings size={18} />
    </button>
  </header>

  <aside class="sidebar"></aside>

  <main class="main">
    <slot />
  </main>
</div>

<SettingsPanel bind:open={settingsOpen} />

<style>
  :global(html, body) {
    margin: 0;
    height: 100%;
    background: var(--surface);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
  }

  .shell {
    display: grid;
    grid-template-areas: "topbar topbar" "sidebar main";
    grid-template-rows: auto 1fr;
    grid-template-columns: 0 minmax(0, 1fr);
    height: 100vh;
  }

  .topbar {
    grid-area: topbar;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    border-bottom: 1px solid var(--border);
    background: var(--topbar-background);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .pill {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 0.8rem;
    letter-spacing: var(--tracking-body);
    line-height: var(--leading-body);
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    padding: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: transform var(--duration-fast);
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

  .icon-button:active {
    transform: scale(0.94);
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
</style>
