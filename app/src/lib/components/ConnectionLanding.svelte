<script lang="ts">
  import { Pencil, Plus } from "@lucide/svelte";
  import Button from "$lib/components/Button.svelte";
  import { getDriver } from "$lib/connections";
  import type { ConnectionProfile } from "$lib/stores/connectionProfiles";
  import databaseIcon from "devicon/icons/sqldeveloper/sqldeveloper-plain.svg?url";

  let {
    profiles,
    connectingId = null,
    onnewconnection,
    onconnect,
    onedit,
  }: {
    profiles: ConnectionProfile[];
    connectingId?: string | null;
    onnewconnection: () => void;
    onconnect: (profile: ConnectionProfile) => void;
    onedit: (profile: ConnectionProfile) => void;
  } = $props();
</script>

<section class="landing" aria-labelledby="connection-state-title">
  {#if profiles.length === 0}
    <div class="empty">
      <img class="database-icon" src={databaseIcon} alt="" aria-hidden="true" />
      <h1 id="connection-state-title">Sin conexiones guardadas</h1>
      <p>Conecta una base de datos para comenzar.</p>
      <Button type="button" variant="primary" onclick={onnewconnection}>Nueva conexión</Button>
    </div>
  {:else}
    <div class="saved">
      <header>
        <h1 id="connection-state-title">Conexiones</h1>
        <p>Selecciona una conexión para abrirla.</p>
      </header>

      <div class="profile-grid" aria-label="Conexiones guardadas">
        {#each profiles as profile (profile.id)}
          {@const driver = getDriver(profile.driver)}
          {@const busy = connectingId !== null}
          <div class="profile-card" class:connecting={connectingId === profile.id}>
            <button
              class="profile-main"
              type="button"
              aria-label={`Conectar a ${profile.name}, ${driver.name}`}
              aria-busy={connectingId === profile.id}
              disabled={busy}
              onclick={() => onconnect(profile)}
            >
              <img class="profile-icon" src={driver.icon} alt="" aria-hidden="true" />
              <strong>{profile.name}</strong>
              <span>{driver.name}</span>
              <small>{profile.database}@{profile.host}</small>
            </button>
            <button
              class="edit-button"
              type="button"
              aria-label={`Editar ${profile.name}`}
              disabled={busy}
              onclick={(event) => {
                event.stopPropagation();
                onedit(profile);
              }}
            >
              <Pencil size={13} aria-hidden="true" />
            </button>
          </div>
        {/each}

        <button
          class="add-card"
          type="button"
          aria-label="Agregar otra conexión"
          onclick={onnewconnection}
        >
          <Plus size={28} aria-hidden="true" />
          <strong>Nueva conexión</strong>
        </button>
      </div>
    </div>
  {/if}
</section>

<style>
  .landing {
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: var(--space-6);
    box-sizing: border-box;
  }

  .empty {
    display: flex;
    min-height: calc(100dvh - 2.625rem - (var(--space-6) * 2));
    box-sizing: border-box;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    text-align: center;
  }

  .database-icon {
    display: block;
    width: 2.25rem;
    height: 2.25rem;
    margin-bottom: var(--space-1);
    object-fit: contain;
    filter: grayscale(1) brightness(1.35);
  }

  .saved {
    width: min(100%, 46rem);
    margin: 0 auto;
    padding-top: clamp(var(--space-5), 6vh, 3.5rem);
  }

  header {
    margin-bottom: var(--space-5);
  }

  h1 {
    margin: 0 0 var(--space-2);
    color: var(--text-primary);
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--tracking-heading);
    line-height: var(--leading-heading);
  }

  p {
    margin: 0 0 var(--space-2);
    color: var(--text-secondary);
    line-height: var(--leading-body);
  }

  .profile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: var(--space-3);
  }

  .profile-card {
    position: relative;
    min-width: 0;
  }

  .profile-main {
    display: flex;
    width: 100%;
    aspect-ratio: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    color: var(--text-primary);
    font: inherit;
    text-align: center;
    cursor: pointer;
    transition:
      border-color var(--duration-fast),
      background-color var(--duration-fast);
  }

  .profile-main:hover:not(:disabled) {
    border-color: var(--control-border);
    background: color-mix(in srgb, var(--surface-elevated) 88%, var(--accent));
  }

  .profile-main:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .profile-main:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .profile-card.connecting .profile-main {
    opacity: 1;
    border-color: var(--accent);
  }

  .edit-button {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--duration-fast);
  }

  .profile-card:hover .edit-button,
  .profile-card:focus-within .edit-button,
  .edit-button:focus-visible {
    opacity: 1;
  }

  .edit-button:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--control-border);
  }

  .edit-button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

  .edit-button:disabled {
    cursor: not-allowed;
  }

  .profile-icon {
    display: block;
    width: 2rem;
    height: 2rem;
    margin-bottom: var(--space-1);
    object-fit: contain;
    filter: grayscale(1) brightness(1.35);
  }

  .profile-card strong,
  .add-card strong {
    max-width: 100%;
    overflow: hidden;
    font-size: 0.875rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-main > span:not(.profile-icon),
  .profile-card small {
    max-width: 100%;
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 0.75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-card small {
    font-size: 0.6875rem;
  }

  .add-card {
    display: flex;
    min-width: 0;
    aspect-ratio: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 1px dashed var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font: inherit;
    text-align: center;
    cursor: pointer;
    transition:
      border-color var(--duration-fast),
      background-color var(--duration-fast);
  }

  .add-card:hover {
    color: var(--text-primary);
    border-color: var(--control-border);
  }

  .add-card:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  @media (max-width: 28rem) {
    .landing {
      padding-inline: var(--space-4);
    }

    .profile-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
