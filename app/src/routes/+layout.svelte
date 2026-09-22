<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import "$lib/styles/tokens.css";
  import { connection } from "$lib/stores/connection";
  import { initThemeEffects } from "$lib/theming/theme";

  let cleanupThemeEffects: (() => void) | undefined;

  onMount(() => {
    cleanupThemeEffects = initThemeEffects();
  });

  onDestroy(() => {
    cleanupThemeEffects?.();
  });
</script>

<div class="shell">
  <header class="topbar">
    <h1>Khipu</h1>
    {#if $connection.connected}
      <span class="pill">{$connection.tableCount} tablas cargadas</span>
    {/if}
  </header>

  <aside class="sidebar"></aside>

  <main class="main">
    <slot />
  </main>
</div>

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

  h1 {
    margin: 0;
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--tracking-heading);
    line-height: var(--leading-heading);
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
