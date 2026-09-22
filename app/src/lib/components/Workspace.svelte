<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { Braces, Columns3, SquareFunction, Table } from "@lucide/svelte";
  import SqlEditor from "$lib/SqlEditor.svelte";
  import type { CompletionItem, CompletionKind } from "$lib/types";

  const kindIcon = {
    Table,
    Column: Columns3,
    Function: SquareFunction,
    Keyword: Braces,
  } as const satisfies Record<CompletionKind, typeof Table>;

  let sql = $state("SELECT * FROM ");
  let suggestions = $state<CompletionItem[]>([]);

  async function onEditorChange(value: string) {
    suggestions = await invoke<CompletionItem[]>("complete", { sql: value });
  }
</script>

<div class="workspace">
  <section class="editor">
    <SqlEditor bind:value={sql} onchange={onEditorChange} />
  </section>

  <aside class="suggestions">
    {#each suggestions as item (item.label)}
      {@const Icon = kindIcon[item.kind]}
      <div class="suggestion">
        <Icon size={14} class="kind-icon" />
        {item.label}
      </div>
    {:else}
      <p class="empty">Sin sugerencias para el texto actual.</p>
    {/each}
  </aside>
</div>

<style>
  .workspace {
    display: grid;
    grid-template-columns: 1fr 260px;
    height: 100%;
  }

  .editor {
    overflow: hidden;
  }

  .suggestions {
    border-left: 1px solid var(--border);
    padding: 0.75rem;
    overflow-y: auto;
  }

  .suggestion {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .suggestion:hover {
    background: var(--surface-elevated);
  }

  .suggestion :global(.kind-icon) {
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  .empty {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
</style>
