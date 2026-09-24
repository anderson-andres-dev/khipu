<script lang="ts">
  import { tick } from "svelte";
  import { Check, ChevronDown, FolderMinus, Plus } from "@lucide/svelte";

  // Pastilla para elegir el grupo de una conexion: sin grupo muestra
  // "+ Añadir grupo"; con grupo, su nombre. Al abrirla se escribe en la
  // misma pastilla y abajo se listan los grupos existentes filtrados, con
  // "Crear «x»" cuando lo escrito no existe todavia.
  let {
    value = $bindable<string | undefined>(undefined),
    groups,
    disabled = false,
  }: {
    value?: string;
    // Grupos ya usados por otras conexiones.
    groups: string[];
    disabled?: boolean;
  } = $props();

  let open = $state(false);
  let query = $state("");
  let active = $state(0);
  let input = $state<HTMLInputElement>();
  let root = $state<HTMLElement>();

  const trimmed = $derived(query.trim());
  const matches = $derived(
    groups.filter((group) => group.toLowerCase().includes(trimmed.toLowerCase())),
  );
  const canCreate = $derived(
    trimmed !== "" && !groups.some((group) => group.toLowerCase() === trimmed.toLowerCase()),
  );
  // Una lista plana de acciones para la navegacion con flechas.
  const options = $derived([
    ...matches.map((group) => ({ kind: "select" as const, group })),
    ...(canCreate ? [{ kind: "create" as const, group: trimmed }] : []),
    ...(value && trimmed === "" ? [{ kind: "remove" as const, group: value }] : []),
  ]);

  async function openPicker() {
    if (disabled) return;
    open = true;
    query = "";
    active = 0;
    await tick();
    input?.focus();
  }

  function close() {
    open = false;
    query = "";
  }

  function choose(option: (typeof options)[number]) {
    value = option.kind === "remove" ? undefined : option.group;
    close();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      active = Math.min(options.length - 1, active + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      active = Math.max(0, active - 1);
    } else if (event.key === "Enter") {
      // Enter nunca envia el formulario desde aca.
      event.preventDefault();
      const option = options[active];
      if (option) choose(option);
    } else if (event.key === "Escape") {
      // Cierra solo el selector, no el modal que lo contiene.
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }

  function handleFocusOut(event: FocusEvent) {
    if (!root?.contains(event.relatedTarget as Node | null)) close();
  }

  $effect(() => {
    // La seleccion vuelve al primer resultado cada vez que cambia el filtro.
    void trimmed;
    active = 0;
  });
</script>

<div class="group-picker" bind:this={root} onfocusout={handleFocusOut}>
  {#if open}
    <div class="pill editing">
      <Plus size={13} aria-hidden="true" />
      <input
        bind:this={input}
        bind:value={query}
        placeholder={value ? value : "Añadir grupo"}
        aria-label="Buscar o crear grupo"
        aria-autocomplete="list"
        aria-controls="group-picker-menu"
        aria-activedescendant={options[active] ? `group-option-${active}` : undefined}
        role="combobox"
        aria-expanded="true"
        onkeydown={handleKeydown}
      />
    </div>

    {#if options.length > 0}
      <div id="group-picker-menu" class="menu" role="listbox" aria-label="Grupos">
        {#each options as option, index (option.kind + option.group)}
          <button
            id={`group-option-${index}`}
            type="button"
            role="option"
            aria-selected={index === active}
            class:active={index === active}
            class:remove={option.kind === "remove"}
            tabindex="-1"
            onmousedown={(event) => event.preventDefault()}
            onmouseenter={() => (active = index)}
            onclick={() => choose(option)}
          >
            {#if option.kind === "create"}
              <Plus size={13} aria-hidden="true" />
              <span>Crear «{option.group}»</span>
            {:else if option.kind === "remove"}
              <FolderMinus size={13} aria-hidden="true" />
              <span>Quitar del grupo</span>
            {:else}
              <span class="check">
                {#if option.group === value}<Check size={13} aria-hidden="true" />{/if}
              </span>
              <span>{option.group}</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  {:else if value}
    <button type="button" class="pill selected" {disabled} title="Cambiar grupo" onclick={openPicker}>
      <span class="pill-label">{value}</span>
      <ChevronDown size={13} aria-hidden="true" />
    </button>
  {:else}
    <button type="button" class="pill add" {disabled} onclick={openPicker}>
      <Plus size={13} aria-hidden="true" />
      <span>Añadir grupo</span>
    </button>
  {/if}
</div>

<style>
  .group-picker {
    position: relative;
    display: inline-flex;
  }

  .pill {
    display: inline-flex;
    max-width: 14rem;
    align-items: center;
    gap: 5px;
    min-height: 1.875rem;
    box-sizing: border-box;
    padding: 0 var(--space-3);
    border: 1px solid transparent;
    border-radius: 999px;
    background: var(--surface-elevated);
    color: var(--text-primary);
    font: inherit;
    font-size: 0.8125rem;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color var(--duration-fast),
      border-color var(--duration-fast),
      color var(--duration-fast);
  }

  .pill.add {
    color: var(--accent);
  }

  .pill:hover:not(:disabled) {
    background: color-mix(in srgb, var(--surface-elevated) 80%, var(--text-primary));
  }

  /* En claro, mezclar 20% de texto (casi negro) sobre blanco da un gris
     pesado: ahi el hover es el del tema. */
  :global(:root[data-scheme="light"]) .pill:hover:not(:disabled) {
    background: var(--surface-hover);
  }

  .pill:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .pill:disabled {
    color: var(--control-disabled);
    cursor: not-allowed;
  }

  .pill-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pill.editing {
    border-color: var(--focus-ring);
    box-shadow: 0 0 0 1px var(--focus-ring);
    color: var(--accent);
    cursor: text;
  }

  .pill.editing input {
    width: 9rem;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--text-primary);
    font: inherit;
  }

  .pill.editing input::placeholder {
    color: var(--text-secondary);
  }

  .menu {
    position: absolute;
    z-index: 30;
    top: calc(100% + 4px);
    left: 0;
    min-width: 12rem;
    max-height: 14rem;
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
  }

  .menu button {
    display: flex;
    width: 100%;
    align-items: center;
    gap: var(--space-2);
    padding: 6px var(--space-2);
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: var(--text-primary);
    font: inherit;
    font-size: 0.8125rem;
    text-align: left;
    cursor: pointer;
  }

  .menu button.active {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .menu button.remove {
    color: var(--text-secondary);
  }

  .check {
    display: inline-flex;
    width: 13px;
    color: var(--accent);
  }
</style>
