<script lang="ts">
  import { Check, ChevronDown } from "@lucide/svelte";
  import { getDriver } from "$lib/connections";
  import { connectToProfile, pendingEdit } from "$lib/stores/connection";
  import type { ConnectionProfile } from "$lib/stores/connectionProfiles";

  let {
    profiles,
    activeProfileId,
    disabled = false,
  }: {
    profiles: ConnectionProfile[];
    activeProfileId: string | null;
    disabled?: boolean;
  } = $props();

  let open = $state(false);
  let activeOption = $state(0);
  const activeProfile = $derived(profiles.find((profile) => profile.id === activeProfileId) ?? null);

  function openMenu() {
    if (disabled || profiles.length === 0) return;
    activeOption = Math.max(
      0,
      profiles.findIndex((profile) => profile.id === activeProfileId),
    );
    open = true;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openMenu();
      else activeOption = Math.min(profiles.length - 1, activeOption + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) openMenu();
      else activeOption = Math.max(0, activeOption - 1);
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      if (profiles[activeOption]) void select(profiles[activeOption]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      open = false;
    }
  }

  // Comparte la misma logica de conexion que la landing page (ver
  // connection.ts). Si falla, le pasa el contexto a +page.svelte via
  // pendingEdit para que abra el modal de edicion, en vez de dejar al
  // usuario en una landing vacia sin explicacion.
  async function select(profile: ConnectionProfile) {
    open = false;
    if (profile.id === activeProfileId) return;

    const result = await connectToProfile(profile);
    if (!result.ok) {
      pendingEdit.set({
        profile,
        error: result.reason === "connect-failed" ? result.error : null,
      });
    }
  }
</script>

<div
  class="switcher"
  onfocusout={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) open = false;
  }}
>
  <button
    class="switcher-trigger"
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open}
    {disabled}
    onclick={() => (open ? (open = false) : openMenu())}
    onkeydown={handleKeydown}
  >
    {#if activeProfile}
      {@const driver = getDriver(activeProfile.driver)}
      <img class="switcher-icon" src={driver.icon} alt="" aria-hidden="true" />
      <span class="switcher-name">{activeProfile.name}</span>
    {:else}
      <span class="switcher-name">Sin conexion</span>
    {/if}
    <ChevronDown size={14} class="switcher-chevron" aria-hidden="true" />
  </button>

  {#if open}
    <div class="switcher-menu" role="listbox" aria-label="Conexiones guardadas">
      {#each profiles as profile, index (profile.id)}
        {@const driver = getDriver(profile.driver)}
        <button
          type="button"
          class:active={index === activeOption}
          class:selected={profile.id === activeProfileId}
          role="option"
          aria-selected={profile.id === activeProfileId}
          tabindex="-1"
          onclick={() => select(profile)}
        >
          <img class="switcher-icon" src={driver.icon} alt="" aria-hidden="true" />
          <span class="option-name">{profile.name}</span>
          {#if profile.id === activeProfileId}
            <Check size={14} aria-hidden="true" />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .switcher {
    position: relative;
    min-width: 0;
  }

  .switcher-trigger {
    display: flex;
    max-width: 12rem;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
    transition:
      border-color var(--duration-fast),
      background-color var(--duration-fast);
  }

  .switcher-trigger:hover:not(:disabled) {
    border-color: var(--border);
    background: var(--surface-elevated);
  }

  .switcher-trigger:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

  .switcher-trigger:disabled {
    color: var(--control-disabled);
    cursor: not-allowed;
  }

  .switcher-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    object-fit: contain;
    filter: grayscale(1) brightness(1.35);
  }

  .switcher-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .switcher-trigger :global(.switcher-chevron) {
    flex-shrink: 0;
    margin-left: auto;
    color: var(--text-secondary);
  }

  .switcher-menu {
    position: absolute;
    z-index: 20;
    top: calc(100% + 4px);
    left: 0;
    display: flex;
    min-width: 14rem;
    flex-direction: column;
    padding: var(--space-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
  }

  .switcher-menu button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font: inherit;
    font-size: 0.8125rem;
    text-align: left;
    cursor: pointer;
  }

  .option-name {
    overflow: hidden;
    flex: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .switcher-menu button:hover,
  .switcher-menu button.active {
    background: color-mix(in srgb, var(--accent) 16%, var(--surface-elevated));
  }

  .switcher-menu button.selected {
    color: var(--accent);
    font-weight: 500;
  }

  .switcher-menu button:focus-visible {
    outline: 1px solid var(--focus-ring);
    outline-offset: -1px;
  }
</style>
