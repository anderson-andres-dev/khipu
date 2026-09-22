<script lang="ts">
  import { Plus } from "@lucide/svelte";
  import Button from "$lib/components/Button.svelte";
  import { getDriver } from "$lib/connections";
  import type { ConnectionProfile } from "$lib/stores/connectionProfiles";
  import databaseIcon from "devicon/icons/sqldeveloper/sqldeveloper-plain.svg?url";

  let {
    profiles,
    onnewconnection,
    onopen,
  }: {
    profiles: ConnectionProfile[];
    onnewconnection: () => void;
    onopen: (profile: ConnectionProfile) => void;
  } = $props();
</script>

<section class="landing" aria-labelledby="connection-state-title">
  {#if profiles.length === 0}
    <div class="empty">
      <span
        class="database-icon"
        style={`--database-icon: url("${databaseIcon}")`}
        aria-hidden="true"
      ></span>
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
          <button
            class="profile-card"
            type="button"
            aria-label={`Abrir ${profile.name}, ${driver.name}`}
            onclick={() => onopen(profile)}
          >
            <span
              class="profile-icon"
              style={`--profile-icon: url("${driver.icon}")`}
              aria-hidden="true"
            ></span>
            <strong>{profile.name}</strong>
            <span>{driver.name}</span>
            <small>{profile.database}@{profile.host}</small>
          </button>
        {/each}

        <button
          class="profile-card add-card"
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
    min-height: calc(100dvh - 2.625rem);
    box-sizing: border-box;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    text-align: center;
  }

  .database-icon {
    width: 2.25rem;
    height: 2.25rem;
    margin-bottom: var(--space-1);
    background: var(--text-secondary);
    mask: var(--database-icon) center / contain no-repeat;
    -webkit-mask: var(--database-icon) center / contain no-repeat;
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
    display: flex;
    min-width: 0;
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

  .profile-card:hover {
    border-color: var(--control-border);
    background: color-mix(in srgb, var(--surface-elevated) 88%, var(--accent));
  }

  .profile-card:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .profile-icon {
    width: 2rem;
    height: 2rem;
    margin-bottom: var(--space-1);
    background: var(--text-secondary);
    mask: var(--profile-icon) center / contain no-repeat;
    -webkit-mask: var(--profile-icon) center / contain no-repeat;
  }

  .profile-card strong {
    max-width: 100%;
    overflow: hidden;
    font-size: 0.875rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-card > span:not(.profile-icon),
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
    border-style: dashed;
    background: transparent;
    color: var(--text-secondary);
  }

  .add-card:hover {
    color: var(--text-primary);
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
