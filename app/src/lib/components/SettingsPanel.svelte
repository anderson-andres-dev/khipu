<script lang="ts">
  import { ArrowLeft, Monitor, Moon, Palette, Sun } from "@lucide/svelte";
  import { palettes, type ThemeFamily } from "$lib/theming/palettes";
  import {
    effectiveScheme,
    themeChoice,
    type SchemePreference,
  } from "$lib/theming/theme";

  let { onclose }: { onclose: () => void } = $props();

  const schemeOptions = [
    { value: "system", label: "Sistema", description: "Usa el modo del sistema operativo", icon: Monitor },
    { value: "light", label: "Claro", description: "Mantiene la interfaz en modo claro", icon: Sun },
    { value: "dark", label: "Oscuro", description: "Mantiene la interfaz en modo oscuro", icon: Moon },
  ] as const satisfies {
    value: SchemePreference;
    label: string;
    description: string;
    icon: typeof Monitor;
  }[];

  const familyOptions: { value: ThemeFamily; label: string }[] = [
    { value: "datagrip", label: "DataGrip" },
    { value: "vscode", label: "VS Code" },
  ];

  function setScheme(scheme: SchemePreference) {
    themeChoice.update((choice) => ({ ...choice, scheme }));
  }

  function setFamily(family: ThemeFamily) {
    themeChoice.update((choice) => ({ ...choice, family }));
  }
</script>

<section class="settings" aria-labelledby="settings-title">
  <aside class="settings-nav" aria-label="Secciones de ajustes">
    <button class="back" type="button" onclick={onclose}>
      <ArrowLeft size={15} aria-hidden="true" />
      Volver
    </button>

    <nav>
      <button class="nav-item active" type="button" aria-current="page">
        <Palette size={15} aria-hidden="true" />
        Apariencia
      </button>
    </nav>
  </aside>

  <div class="settings-main">
    <div class="settings-content">
      <header>
        <h1 id="settings-title">Apariencia</h1>
        <p>Personaliza el aspecto del shell y del editor.</p>
      </header>

      <fieldset>
        <legend>Apariencia</legend>
        <div class="scheme-grid">
          {#each schemeOptions as option (option.value)}
            {@const Icon = option.icon}
            <button
              class:selected={$themeChoice.scheme === option.value}
              type="button"
              aria-pressed={$themeChoice.scheme === option.value}
              onclick={() => setScheme(option.value)}
            >
              <Icon size={18} aria-hidden="true" />
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend>Paleta</legend>
        <div class="palette-grid">
          {#each familyOptions as option (option.value)}
            {@const preview = palettes[option.value][$effectiveScheme]}
            <button
              class:selected={$themeChoice.family === option.value}
              class="palette-option"
              type="button"
              aria-pressed={$themeChoice.family === option.value}
              onclick={() => setFamily(option.value)}
            >
              <span
                class="theme-preview"
                style:background={preview.shell.surface}
                style:border-color={preview.shell.border}
                aria-hidden="true"
              >
                <span
                  class="preview-sidebar"
                  style:background={preview.shell.surfaceElevated}
                  style:border-color={preview.shell.border}
                ></span>
                <span class="preview-lines">
                  <i style:background={preview.editor.keyword}></i>
                  <i style:background={preview.editor.string}></i>
                  <i style:background={preview.shell.textSecondary}></i>
                </span>
              </span>
              <span class="palette-name">{option.label}</span>
              <span class="selection" aria-hidden="true"></span>
            </button>
          {/each}
        </div>
      </fieldset>
    </div>
  </div>
</section>

<style>
  .settings {
    display: grid;
    grid-template-columns: 11rem minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    background: var(--surface);
  }

  .settings-nav {
    min-width: 0;
    padding: var(--space-4) var(--space-3);
    border-right: 1px solid var(--border);
    background: var(--surface-elevated);
  }

  .back,
  .nav-item {
    display: flex;
    width: 100%;
    align-items: center;
    gap: var(--space-2);
    min-height: 2rem;
    padding: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font: inherit;
    font-size: 0.8125rem;
    text-align: left;
    cursor: pointer;
  }

  .back {
    margin-bottom: var(--space-5);
  }

  .back:hover,
  .nav-item:hover {
    color: var(--text-primary);
    background: color-mix(in srgb, var(--surface-elevated) 88%, var(--accent));
  }

  .nav-item.active {
    background: color-mix(in srgb, var(--surface-elevated) 84%, var(--accent));
    color: var(--text-primary);
  }

  .back:focus-visible,
  .nav-item:focus-visible,
  .scheme-grid button:focus-visible,
  .palette-option:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .settings-main {
    min-width: 0;
    overflow: auto;
    padding: clamp(var(--space-6), 6vh, 3.5rem) var(--space-6);
  }

  .settings-content {
    width: min(100%, 46rem);
    margin: 0 auto;
  }

  header {
    margin-bottom: var(--space-6);
  }

  h1 {
    margin: 0 0 var(--space-2);
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--tracking-heading);
    line-height: var(--leading-heading);
  }

  header p {
    margin: 0;
    color: var(--text-secondary);
  }

  fieldset {
    min-width: 0;
    margin: 0 0 var(--space-6);
    padding: 0;
    border: 0;
  }

  legend {
    margin-bottom: var(--space-3);
    padding: 0;
    color: var(--text-primary);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .scheme-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-2);
  }

  .scheme-grid button,
  .palette-option {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
    color: var(--text-primary);
    font: inherit;
    cursor: pointer;
    transition:
      border-color var(--duration-fast),
      background-color var(--duration-fast);
  }

  .scheme-grid button {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-1) var(--space-2);
    min-height: 4.25rem;
    padding: var(--space-3);
    text-align: left;
  }

  .scheme-grid button > :global(svg) {
    grid-row: 1 / 3;
    color: var(--text-secondary);
  }

  .scheme-grid strong {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .scheme-grid span {
    color: var(--text-secondary);
    font-size: 0.6875rem;
    line-height: 1.3;
  }

  .scheme-grid button:hover,
  .palette-option:hover {
    border-color: var(--control-border);
  }

  .scheme-grid button.selected,
  .palette-option.selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--surface-elevated) 92%, var(--accent));
  }

  .palette-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }

  .palette-option {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    text-align: left;
  }

  .theme-preview {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: 28% 1fr;
    height: 4.5rem;
    overflow: hidden;
    border: 1px solid;
    border-radius: calc(var(--radius-sm) - 2px);
  }

  .preview-sidebar {
    border-right: 1px solid;
  }

  .preview-lines {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: var(--space-3);
  }

  .preview-lines i {
    display: block;
    width: 70%;
    height: 0.3rem;
    border-radius: 999px;
  }

  .preview-lines i:nth-child(2) {
    width: 48%;
  }

  .preview-lines i:nth-child(3) {
    width: 82%;
  }

  .palette-name {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .selection {
    width: 0.625rem;
    height: 0.625rem;
    border: 1px solid var(--control-border);
    border-radius: 50%;
  }

  .palette-option.selected .selection {
    border-color: var(--accent);
    background: var(--accent);
    box-shadow: inset 0 0 0 2px var(--surface-elevated);
  }

  @media (max-width: 42rem) {
    .settings {
      grid-template-columns: 8rem minmax(0, 1fr);
    }

    .settings-main {
      padding: var(--space-5) var(--space-4);
    }

    .scheme-grid,
    .palette-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
