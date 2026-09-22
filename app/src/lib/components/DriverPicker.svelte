<script lang="ts">
  import { ArrowLeft } from "@lucide/svelte";
  import { connectionDrivers, type ConnectionDriver } from "$lib/connections";

  let {
    selected,
    onselect,
    oncancel,
  }: {
    selected: ConnectionDriver | null;
    onselect: (driver: ConnectionDriver) => void;
    oncancel: () => void;
  } = $props();

</script>

<section class="picker" aria-labelledby="driver-picker-title">
  <div class="content">
    <button class="back" type="button" onclick={oncancel}>
      <ArrowLeft size={15} aria-hidden="true" />
      Conexiones
    </button>

    <header>
      <h1 id="driver-picker-title">Nueva conexión</h1>
      <p>Selecciona el motor de la base de datos.</p>
    </header>

    <div class="driver-list" aria-label="Motores disponibles">
      {#each connectionDrivers as driver (driver.id)}
        <button
          class:selected={selected === driver.id}
          class="driver"
          type="button"
          aria-pressed={selected === driver.id}
          onclick={() => onselect(driver.id)}
        >
          <img class="driver-icon" src={driver.icon} alt="" aria-hidden="true" />
          <strong>{driver.name}</strong>
        </button>
      {/each}
    </div>
  </div>
</section>

<style>
  .picker {
    min-height: 100%;
    overflow: auto;
    box-sizing: border-box;
    padding: clamp(var(--space-6), 8vh, 4.5rem) var(--space-6);
  }

  .content {
    width: min(100%, 30rem);
    margin: 0 auto;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-5);
    padding: var(--space-1) 0;
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .back:hover {
    color: var(--text-primary);
  }

  .back:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 3px;
    border-radius: var(--radius-sm);
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
    margin: 0;
    color: var(--text-secondary);
    line-height: var(--leading-body);
  }

  .driver-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
  }

  .driver {
    display: flex;
    width: 100%;
    min-width: 0;
    aspect-ratio: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
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

  .driver:hover {
    border-color: var(--control-border);
    background: color-mix(in srgb, var(--surface-elevated) 88%, var(--accent));
  }

  .driver.selected {
    border-color: var(--accent);
  }

  .driver:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .driver-icon {
    display: block;
    width: 2rem;
    height: 2rem;
    object-fit: contain;
    filter: grayscale(1) brightness(1.35);
  }

  .driver strong {
    font-size: 0.875rem;
    font-weight: 600;
  }

  @media (max-width: 28rem) {
    .picker {
      padding-inline: var(--space-4);
    }

    .driver-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
