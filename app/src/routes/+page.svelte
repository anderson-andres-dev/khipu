<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import SqlEditor from "$lib/SqlEditor.svelte";
  import type { CompletionItem } from "$lib/types";

  let sql = $state("SELECT * FROM ");
  let suggestions = $state<CompletionItem[]>([]);

  async function onEditorChange(value: string) {
    suggestions = await invoke<CompletionItem[]>("complete", { sql: value });
  }
</script>

<main class="app">
  <header>
    <h1>Khipu</h1>
  </header>

  <section class="editor">
    <SqlEditor bind:value={sql} onchange={onEditorChange} />
  </section>

  <aside class="suggestions">
    {#each suggestions as item (item.label)}
      <div class="suggestion">{item.label}<span class="kind">{item.kind}</span></div>
    {:else}
      <p class="empty">Sin sugerencias todavía — el catálogo de esquema aún no está conectado.</p>
    {/each}
  </aside>
</main>

<style>
  :global(html, body) {
    margin: 0;
    height: 100%;
    background: #1e1e1e;
    color: #ddd;
    font-family: -apple-system, Inter, system-ui, sans-serif;
  }

  .app {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: 1fr 260px;
    height: 100vh;
  }

  header {
    grid-column: 1 / -1;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #333;
  }

  h1 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .editor {
    overflow: hidden;
  }

  .suggestions {
    border-left: 1px solid #333;
    padding: 0.75rem;
    overflow-y: auto;
  }

  .suggestion {
    display: flex;
    justify-content: space-between;
    padding: 0.35rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .suggestion:hover {
    background: #2a2a2a;
  }

  .kind {
    color: #888;
    font-size: 0.75rem;
  }

  .empty {
    color: #777;
    font-size: 0.8rem;
  }
</style>
