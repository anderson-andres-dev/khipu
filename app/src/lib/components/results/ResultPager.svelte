<script lang="ts">
  import { tick } from "svelte";
  import { Check, ChevronDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, LoaderCircle } from "@lucide/svelte";
  import type { ResultPage } from "$lib/types";
  import { MAX_PAGE_SIZE, PAGE_SIZE_OPTIONS, clampPageSize, defaultPageSize } from "$lib/stores/resultPaging";

  let {
    page,
    rowCount,
    hasMore,
    totalRows,
    counting,
    busy,
    nextShortcut = "",
    previousShortcut = "",
    onnavigate,
    oncount,
  }: {
    page: ResultPage;
    // Filas de la pagina actual.
    rowCount: number;
    // Hay al menos una fila despues de esta pagina.
    hasMore: boolean;
    totalRows: number | null;
    counting: boolean;
    // Ejecutando (otra pagina o la cuenta): los controles se deshabilitan.
    busy: boolean;
    nextShortcut?: string;
    previousShortcut?: string;
    onnavigate: (offset: number, pageSize: number) => void;
    // Pide el COUNT(*); resuelve con el total, o null si fallo.
    oncount: () => Promise<number | null>;
  } = $props();

  const numberFormat = new Intl.NumberFormat("es");
  const format = (value: number) => numberFormat.format(value);

  const start = $derived(rowCount === 0 ? 0 : page.offset + 1);
  const end = $derived(page.offset + rowCount);
  const canGoBack = $derived(page.pageable && page.offset > 0 && !busy);
  const canGoForward = $derived(page.pageable && hasMore && !busy);
  const isAll = $derived(page.pageSize >= MAX_PAGE_SIZE);

  function lastOffsetFor(total: number): number {
    return total <= 0 ? 0 : Math.floor((total - 1) / page.pageSize) * page.pageSize;
  }

  function goFirst() {
    onnavigate(0, page.pageSize);
  }

  function goPrevious() {
    onnavigate(Math.max(0, page.offset - page.pageSize), page.pageSize);
  }

  function goNext() {
    onnavigate(page.offset + page.pageSize, page.pageSize);
  }

  // Sin total conocido, la ultima pagina necesita el COUNT(*) primero.
  async function goLast() {
    const total = totalRows ?? (await oncount());
    if (total !== null) onnavigate(lastOffsetFor(total), page.pageSize);
  }

  // Un tamaño nuevo mantiene a la vista la primera fila actual: se va a la
  // pagina (del tamaño nuevo) que la contiene.
  function changePageSize(size: number) {
    menuOpen = false;
    const next = clampPageSize(size);
    if (next === page.pageSize) return;
    onnavigate(Math.floor(page.offset / next) * next, next);
  }

  // --- Selector de tamaño de pagina ----------------------------------
  let menuOpen = $state(false);
  let customOpen = $state(false);
  let customValue = $state("");
  let customInput = $state<HTMLInputElement>();
  let sizeButton = $state<HTMLButtonElement>();
  let menuEl = $state<HTMLDivElement>();
  let menuPosition = $state({ left: 0, bottom: 0 });

  async function toggleMenu() {
    hideTooltip();
    if (menuOpen) {
      menuOpen = false;
      return;
    }
    customOpen = false;
    const rect = sizeButton?.getBoundingClientRect();
    if (rect) menuPosition = { left: rect.left, bottom: window.innerHeight - rect.top + 6 };
    menuOpen = true;
    await tick();
    menuEl?.querySelector<HTMLElement>(".menu-item.selected, .menu-item")?.focus();
  }

  async function openCustom() {
    customOpen = true;
    customValue = String(page.pageSize);
    await tick();
    customInput?.focus();
    customInput?.select();
  }

  function applyCustom() {
    const value = Number(customValue);
    if (Number.isFinite(value) && value > 0) changePageSize(value);
  }

  function setAsDefault() {
    defaultPageSize.set(page.pageSize);
    menuOpen = false;
  }

  function onWindowPointerDown(event: PointerEvent) {
    if (!menuOpen) return;
    const target = event.target as Node;
    if (menuEl?.contains(target) || sizeButton?.contains(target)) return;
    menuOpen = false;
  }

  function onMenuKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      menuOpen = false;
      sizeButton?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = [...(menuEl?.querySelectorAll<HTMLElement>(".menu-item") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
    event.preventDefault();
  }

  // --- Tooltips ----------------------------------------------------------
  // Propios (no el title nativo): salen enseguida, con el atajo al lado y
  // encima de la barra, que esta al pie del panel.
  let tooltip = $state<{ label: string; shortcut: string; x: number; bottom: number } | null>(null);
  let tooltipTimer: ReturnType<typeof setTimeout> | null = null;

  function prettyShortcut(keys: string): string {
    return keys.replace("ArrowDown", "Abajo").replace("ArrowUp", "Arriba");
  }

  function showTooltip(event: Event, label: string, shortcut = "") {
    if (menuOpen) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (tooltipTimer) clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => {
      tooltip = {
        label,
        shortcut: prettyShortcut(shortcut),
        x: rect.left + rect.width / 2,
        bottom: window.innerHeight - rect.top + 6,
      };
    }, 350);
  }

  function hideTooltip() {
    if (tooltipTimer) clearTimeout(tooltipTimer);
    tooltipTimer = null;
    tooltip = null;
  }

  $effect(() => () => {
    if (tooltipTimer) clearTimeout(tooltipTimer);
  });
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

{#snippet navButton(label: string, shortcut: string, enabled: boolean, action: () => void, Icon: typeof ChevronLeft)}
  <button
    type="button"
    class="nav-button"
    aria-label={label}
    disabled={!enabled}
    onclick={() => {
      hideTooltip();
      action();
    }}
    onpointerenter={(event) => showTooltip(event, label, shortcut)}
    onpointerleave={hideTooltip}
    onfocus={(event) => showTooltip(event, label, shortcut)}
    onblur={hideTooltip}
  >
    <Icon size={15} aria-hidden="true" />
  </button>
{/snippet}

<div class="pager" role="group" aria-label="Paginación del resultado">
  {@render navButton("Primera página", "", canGoBack, goFirst, ChevronFirst)}
  {@render navButton("Página anterior", previousShortcut, canGoBack, goPrevious, ChevronLeft)}

  <button
    type="button"
    class="range-button"
    class:open={menuOpen}
    aria-haspopup="menu"
    aria-expanded={menuOpen}
    disabled={busy}
    bind:this={sizeButton}
    onclick={() => void toggleMenu()}
    onpointerenter={(event) => showTooltip(event, "Cambiar tamaño de página")}
    onpointerleave={hideTooltip}
  >
    <span class="range">{format(start)}-{format(end)}</span>
    <ChevronDown size={13} aria-hidden="true" />
  </button>

  <span class="of">de</span>

  {#if totalRows !== null}
    <span class="total">{format(totalRows)}</span>
  {:else if page.pageable}
    <button
      type="button"
      class="total-button"
      disabled={busy || counting}
      onclick={() => {
        hideTooltip();
        void oncount();
      }}
      onpointerenter={(event) => showTooltip(event, "Clic para contar el total (ejecuta SELECT COUNT(*) FROM …)")}
      onpointerleave={hideTooltip}
    >
      {#if counting}
        <LoaderCircle size={13} class="spin" aria-label="Contando filas" />
      {:else}
        {format(end)}+
      {/if}
    </button>
  {:else}
    <span class="total" title="Esta sentencia no se puede paginar">{format(end)}+</span>
  {/if}

  {@render navButton("Página siguiente", nextShortcut, canGoForward, goNext, ChevronRight)}
  {@render navButton("Última página", "", canGoForward, () => void goLast(), ChevronLast)}
</div>

{#if menuOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="size-menu"
    role="menu"
    tabindex="-1"
    aria-label="Tamaño de página"
    bind:this={menuEl}
    style={`left:${menuPosition.left}px; bottom:${menuPosition.bottom}px;`}
    onkeydown={onMenuKeydown}
  >
    <div class="menu-heading">Tamaño de página</div>
    {#each PAGE_SIZE_OPTIONS as size (size)}
      <button
        type="button"
        role="menuitemradio"
        aria-checked={page.pageSize === size}
        class="menu-item"
        class:selected={page.pageSize === size}
        onclick={() => changePageSize(size)}
      >
        <span class="check">{#if page.pageSize === size}<Check size={13} aria-hidden="true" />{/if}</span>
        <span>{format(size)}</span>
        {#if size === $defaultPageSize}<span class="hint">Predeterminado</span>{/if}
      </button>
    {/each}
    <button
      type="button"
      role="menuitemradio"
      aria-checked={isAll}
      class="menu-item"
      class:selected={isAll}
      onclick={() => changePageSize(MAX_PAGE_SIZE)}
    >
      <span class="check">{#if isAll}<Check size={13} aria-hidden="true" />{/if}</span>
      <span>Todas</span>
      <span class="hint">hasta {format(MAX_PAGE_SIZE)}</span>
    </button>
    {#if customOpen}
      <form
        class="custom-row"
        onsubmit={(event) => {
          event.preventDefault();
          applyCustom();
        }}
      >
        <input
          type="number"
          min="1"
          max={MAX_PAGE_SIZE}
          aria-label="Tamaño de página personalizado"
          bind:this={customInput}
          bind:value={customValue}
          onkeydown={(event) => event.stopPropagation()}
        />
        <button type="submit" class="apply">Aplicar</button>
      </form>
    {:else}
      <button type="button" role="menuitem" class="menu-item" onclick={() => void openCustom()}>
        <span class="check">
          {#if !isAll && !PAGE_SIZE_OPTIONS.includes(page.pageSize as (typeof PAGE_SIZE_OPTIONS)[number])}
            <Check size={13} aria-hidden="true" />
          {/if}
        </span>
        <span>Personalizado…</span>
      </button>
    {/if}
    <div class="menu-separator" role="separator"></div>
    <button
      type="button"
      role="menuitem"
      class="menu-item"
      disabled={page.pageSize === $defaultPageSize}
      onclick={setAsDefault}
    >
      <span class="check"></span>
      <span>Establecer como predeterminado</span>
    </button>
  </div>
{/if}

{#if tooltip}
  <div class="pager-tooltip" role="tooltip" style={`left:${tooltip.x}px; bottom:${tooltip.bottom}px;`}>
    <span>{tooltip.label}</span>
    {#if tooltip.shortcut}<span class="tooltip-shortcut">{tooltip.shortcut}</span>{/if}
  </div>
{/if}

<style>
  .pager {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .nav-button,
  .range-button,
  .total-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 1.75rem;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font: inherit;
    cursor: pointer;
    transition:
      background-color var(--duration-fast) ease,
      color var(--duration-fast) ease;
  }

  .nav-button {
    width: 1.75rem;
    padding: 0;
  }

  .range-button {
    gap: 3px;
    margin: 0 var(--space-1);
    padding: 0 var(--space-2);
    color: var(--text-primary);
  }

  .range-button.open {
    background: var(--surface-hover);
  }

  .total-button {
    min-width: 2rem;
    padding: 0 var(--space-1);
    color: var(--text-primary);
    text-decoration: underline dotted color-mix(in srgb, var(--text-secondary) 60%, transparent);
    text-underline-offset: 3px;
  }

  .nav-button:hover:not(:disabled),
  .range-button:hover:not(:disabled),
  .total-button:hover:not(:disabled) {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .nav-button:disabled,
  .range-button:disabled,
  .total-button:disabled {
    cursor: default;
    opacity: 0.4;
  }

  .total-button:disabled:has(:global(.spin)) {
    opacity: 1;
  }

  .nav-button:focus-visible,
  .range-button:focus-visible,
  .total-button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: -2px;
  }

  .range,
  .total,
  .total-button {
    font-variant-numeric: tabular-nums;
  }

  .of {
    color: var(--text-secondary);
  }

  .total {
    padding: 0 var(--space-1);
    color: var(--text-primary);
  }

  .size-menu {
    position: fixed;
    z-index: 1000;
    display: flex;
    min-width: 13rem;
    flex-direction: column;
    padding: var(--space-1);
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
    font-size: 0.8125rem;
    outline: none;
  }

  .menu-heading {
    padding: var(--space-1) var(--space-2) var(--space-1) calc(var(--space-2) + 1.25rem);
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 1.75rem;
    padding: 0 var(--space-3) 0 var(--space-2);
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .menu-item:hover:not(:disabled),
  .menu-item:focus-visible {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    outline: none;
  }

  .menu-item:disabled {
    color: var(--text-secondary);
    cursor: default;
    opacity: 0.6;
  }

  .check {
    display: inline-flex;
    width: 1rem;
    flex-shrink: 0;
    justify-content: center;
    color: var(--accent);
  }

  .hint {
    margin-left: auto;
    padding-left: var(--space-3);
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .menu-separator {
    height: 1px;
    margin: var(--space-1) var(--space-2);
    background: var(--border);
  }

  .custom-row {
    display: flex;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2) var(--space-1) calc(var(--space-2) + 1.25rem);
  }

  .custom-row input {
    width: 0;
    min-width: 0;
    flex: 1;
    padding: 2px var(--space-2);
    border: 1px solid var(--focus-ring);
    border-radius: var(--radius-sm);
    outline: none;
    background: var(--surface);
    color: var(--text-primary);
    font: inherit;
  }

  .apply {
    padding: 2px var(--space-2);
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: var(--text-on-accent);
    font: inherit;
    cursor: pointer;
  }

  .pager-tooltip {
    position: fixed;
    z-index: 1001;
    display: flex;
    gap: var(--space-3);
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
    color: var(--text-primary);
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
    transform: translateX(-50%);
  }

  .tooltip-shortcut {
    color: var(--text-secondary);
  }
</style>
