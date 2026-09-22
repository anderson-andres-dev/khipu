<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { ContextMenuItem } from "$lib/contextMenu";

  let {
    x,
    y,
    items,
    onclose,
  }: {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onclose: () => void;
  } = $props();

  let menu: HTMLDivElement;
  let left = $state(0);
  let top = $state(0);

  async function placeMenu() {
    const requestedX = x;
    const requestedY = y;
    await tick();
    if (!menu) return;
    const bounds = menu.getBoundingClientRect();
    left = Math.max(8, Math.min(requestedX, window.innerWidth - bounds.width - 8));
    top = Math.max(8, Math.min(requestedY, window.innerHeight - bounds.height - 8));
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onclose();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = [...menu.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
    if (buttons.length === 0) return;
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    buttons[(current + step + buttons.length) % buttons.length].focus();
  }

  async function run(item: ContextMenuItem) {
    if (item.disabled) return;
    onclose();
    await item.action();
  }

  $effect(() => {
    x;
    y;
    void placeMenu();
  });

  onMount(() => {
    const close = () => onclose();
    document.addEventListener("pointerdown", close);
    document.addEventListener("contextmenu", close);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("khipu:context-menu", close);
    void placeMenu().then(() => menu.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus());

    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("contextmenu", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("khipu:context-menu", close);
    };
  });
</script>

<div
  class="context-menu"
  role="menu"
  tabindex="-1"
  aria-label="Menú contextual"
  bind:this={menu}
  style:left={`${left}px`}
  style:top={`${top}px`}
  onpointerdown={(event) => event.stopPropagation()}
  oncontextmenu={(event) => event.preventDefault()}
  onkeydown={handleKeydown}
>
  {#each items as item}
    {#if item.separatorBefore}<div class="separator" role="separator"></div>{/if}
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onclick={() => run(item)}
    >
      <span>{item.label}</span>
      {#if item.shortcut}<kbd>{item.shortcut}</kbd>{/if}
    </button>
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 1000;
    min-width: 12rem;
    padding: var(--space-1);
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: 0.8125rem;
  }

  button {
    display: flex;
    width: 100%;
    min-height: 1.875rem;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-1) var(--space-2);
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  button:hover,
  button:focus-visible {
    outline: none;
    background: color-mix(in srgb, var(--accent) 22%, var(--surface-elevated));
  }

  button:disabled {
    color: var(--control-disabled);
    cursor: default;
  }

  button:disabled:hover {
    background: transparent;
  }

  kbd {
    color: var(--text-secondary);
    font: inherit;
    font-size: 0.75rem;
  }

  .separator {
    height: 1px;
    margin: var(--space-1) calc(var(--space-1) * -1);
    background: var(--border);
  }
</style>
