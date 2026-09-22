<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { basicSetup, EditorView } from "codemirror";
  import { sql } from "@codemirror/lang-sql";
  import { Compartment } from "@codemirror/state";
  import { buildCmTheme } from "$lib/theming/codemirrorTheme";
  import { editorPalette, effectiveScheme } from "$lib/theming/theme";

  let { value = $bindable(""), onchange }: { value?: string; onchange?: (sql: string) => void } = $props();

  let container: HTMLDivElement;
  let view: EditorView | undefined;
  const themeCompartment = new Compartment();

  onMount(() => {
    view = new EditorView({
      doc: value,
      parent: container,
      extensions: [
        basicSetup,
        sql(),
        themeCompartment.of(buildCmTheme(get(editorPalette), get(effectiveScheme))),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            value = update.state.doc.toString();
            onchange?.(value);
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
