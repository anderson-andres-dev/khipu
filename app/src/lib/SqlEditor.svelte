<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { basicSetup, EditorView } from "codemirror";
  import { sql } from "@codemirror/lang-sql";
  import { oneDark } from "@codemirror/theme-one-dark";

  let { value = $bindable(""), onchange }: { value?: string; onchange?: (sql: string) => void } = $props();

  let container: HTMLDivElement;
  let view: EditorView | undefined;

  onMount(() => {
    view = new EditorView({
      doc: value,
      parent: container,
      extensions: [
        basicSetup,
        sql(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            value = update.state.doc.toString();
            onchange?.(value);
          }
        }),
      ],
    });
  });

  onDestroy(() => view?.destroy());
</script>

<div class="sql-editor" bind:this={container}></div>

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
