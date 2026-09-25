<script lang="ts">
  import { ArrowLeft, Code2, Keyboard, Languages, Monitor, Moon, Palette, Pencil, RotateCcw, Sun } from "@lucide/svelte";
  import { LOCALE_NAMES, LOCALES, locale, localePreference, t, type LocalePreference, type MessageKey } from "$lib/i18n";
  import { palettes, type ThemeFamily } from "$lib/theming/palettes";
  import {
    effectiveScheme,
    themeChoice,
    type SchemePreference,
  } from "$lib/theming/theme";
  import {
    formatShortcutEvent,
    resetShortcutKeys,
    setShortcutKeys,
    shortcuts,
  } from "$lib/stores/shortcuts";
  import {
    DEFAULT_FORMATTER_LINE_WIDTH,
    MAX_FORMATTER_LINE_WIDTH,
    MIN_FORMATTER_LINE_WIDTH,
    editorSettings,
    setAutoUppercaseKeywords,
    setFormatterLineWidth,
    setTabNavigatesCompletion,
  } from "$lib/stores/editorSettings";

  let { onclose }: { onclose: () => void } = $props();

  type Section = "appearance" | "editor" | "language" | "shortcuts";
  let activeSection = $state<Section>("appearance");
  let recordingId = $state<string | null>(null);

  function startRecording(id: string) {
    recordingId = id;
  }

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  function handleRecordKeydown(event: KeyboardEvent, id: string) {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Escape") {
      recordingId = null;
      return;
    }

    const keys = formatShortcutEvent(event);
    if (!keys) return; // solo se solto un modificador, seguir esperando

    setShortcutKeys(id, keys);
    recordingId = null;
  }

  let dialogEl: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (dialogEl && !dialogEl.open) dialogEl.showModal();
  });

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === dialogEl) dialogEl?.close();
  }

  const schemeOptions = [
    { value: "system", icon: Monitor },
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
  ] as const satisfies {
    value: SchemePreference;
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

  const localeOptions: LocalePreference[] = ["system", ...LOCALES];

  function shortcutText(id: string, field: "label" | "description"): string {
    return $t(`shortcuts.${id}.${field}` as MessageKey);
  }
</script>

<dialog bind:this={dialogEl} aria-labelledby="settings-title" onclose={onclose} onclick={handleBackdropClick}>
<section class="settings">
  <aside class="settings-nav" aria-label={$t("settings.sections")}>
    <button class="back" type="button" onclick={() => dialogEl?.close()}>
      <ArrowLeft size={15} aria-hidden="true" />
      {$t("common.back")}
    </button>

    <nav>
      <button
        class="nav-item"
        class:active={activeSection === "editor"}
        type="button"
        aria-current={activeSection === "editor" ? "page" : undefined}
        onclick={() => (activeSection = "editor")}
      >
        <Code2 size={15} aria-hidden="true" />
        {$t("settings.nav.editor")}
      </button>
      <button
        class="nav-item"
        class:active={activeSection === "appearance"}
        type="button"
        aria-current={activeSection === "appearance" ? "page" : undefined}
        onclick={() => (activeSection = "appearance")}
      >
        <Palette size={15} aria-hidden="true" />
        {$t("settings.nav.appearance")}
      </button>
      <button
        class="nav-item"
        class:active={activeSection === "language"}
        type="button"
        aria-current={activeSection === "language" ? "page" : undefined}
        onclick={() => (activeSection = "language")}
      >
        <Languages size={15} aria-hidden="true" />
        {$t("settings.nav.language")}
      </button>
      <button
        class="nav-item"
        class:active={activeSection === "shortcuts"}
        type="button"
        aria-current={activeSection === "shortcuts" ? "page" : undefined}
        onclick={() => (activeSection = "shortcuts")}
      >
        <Keyboard size={15} aria-hidden="true" />
        {$t("settings.nav.shortcuts")}
      </button>
    </nav>
  </aside>

  <div class="settings-main">
    {#if activeSection === "appearance"}
      <div class="settings-content">
        <header>
          <h1 id="settings-title">{$t("settings.appearance.title")}</h1>
          <p>{$t("settings.appearance.subtitle")}</p>
        </header>

        <fieldset>
          <legend>{$t("settings.appearance.scheme")}</legend>
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
                <strong>{$t(`settings.scheme.${option.value}`)}</strong>
                <span>{$t(`settings.scheme.${option.value}.description`)}</span>
              </button>
            {/each}
          </div>
        </fieldset>

        <fieldset>
          <legend>{$t("settings.appearance.palette")}</legend>
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
    {:else if activeSection === "language"}
      <div class="settings-content">
        <header>
          <h1 id="settings-title">{$t("settings.language.title")}</h1>
          <p>{$t("settings.language.subtitle")}</p>
        </header>

        <fieldset>
          <legend>{$t("settings.language.legend")}</legend>
          <div class="language-list" role="radiogroup" aria-label={$t("settings.language.legend")}>
            {#each localeOptions as option (option)}
              <button
                class:selected={$localePreference === option}
                type="button"
                role="radio"
                aria-checked={$localePreference === option}
                onclick={() => localePreference.set(option)}
              >
                {#if option === "system"}
                  <strong>{$t("settings.language.system")}</strong>
                  <span>{$t("settings.language.system.description", { language: LOCALE_NAMES[$locale] })}</span>
                {:else}
                  <strong lang={option}>{LOCALE_NAMES[option]}</strong>
                {/if}
                <span class="selection" aria-hidden="true"></span>
              </button>
            {/each}
          </div>
        </fieldset>
      </div>
    {:else if activeSection === "editor"}
      <div class="settings-content">
        <header>
          <h1 id="settings-title">{$t("settings.editor.title")}</h1>
          <p>{$t("settings.editor.subtitle")}</p>
        </header>

        <fieldset>
          <legend>{$t("settings.editor.format")}</legend>
          <div class="setting-row">
            <div class="setting-text">
              <label for="formatter-line-width">{$t("settings.editor.lineWidth")}</label>
              <span>{$t("settings.editor.lineWidth.description")}</span>
            </div>
            <div class="number-setting">
              <input
                id="formatter-line-width"
                type="number"
                min={MIN_FORMATTER_LINE_WIDTH}
                max={MAX_FORMATTER_LINE_WIDTH}
                step="1"
                value={$editorSettings.formatterLineWidth}
                onchange={(event) => setFormatterLineWidth(event.currentTarget.valueAsNumber)}
              />
              <span>{$t("settings.editor.characters")}</span>
              {#if $editorSettings.formatterLineWidth !== DEFAULT_FORMATTER_LINE_WIDTH}
                <button
                  class="shortcut-icon-button"
                  type="button"
                  aria-label={$t("settings.editor.lineWidth.resetLabel", { width: DEFAULT_FORMATTER_LINE_WIDTH })}
                  title={$t("settings.editor.lineWidth.resetTitle", { width: DEFAULT_FORMATTER_LINE_WIDTH })}
                  onclick={() => setFormatterLineWidth(DEFAULT_FORMATTER_LINE_WIDTH)}
                >
                  <RotateCcw size={13} aria-hidden="true" />
                </button>
              {/if}
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-text">
              <span class="setting-label">{$t("settings.editor.uppercase")}</span>
              <span>
                {$t("settings.editor.uppercase.before")} <code>select</code> {$t("settings.editor.uppercase.and")}
                <code>where</code> {$t("settings.editor.uppercase.after")}
              </span>
            </div>
            <button
              class="switch"
              class:enabled={$editorSettings.autoUppercaseKeywords}
              type="button"
              role="switch"
              aria-checked={$editorSettings.autoUppercaseKeywords}
              aria-label={$t("settings.editor.uppercase.aria")}
              onclick={() => setAutoUppercaseKeywords(!$editorSettings.autoUppercaseKeywords)}
            >
              <span aria-hidden="true"></span>
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{$t("settings.editor.completion")}</legend>
          <div class="setting-row">
            <div class="setting-text">
              <span class="setting-label">{$t("settings.editor.tabNavigation")}</span>
              <span>
                {$t("settings.editor.tabNavigation.before")} <code>Tab</code> {$t("settings.editor.tabNavigation.middle")}
                <code>Shift+Tab</code> {$t("settings.editor.tabNavigation.after")}
              </span>
            </div>
            <button
              class="switch"
              class:enabled={$editorSettings.tabNavigatesCompletion}
              type="button"
              role="switch"
              aria-checked={$editorSettings.tabNavigatesCompletion}
              aria-label={$t("settings.editor.tabNavigation.aria")}
              onclick={() => setTabNavigatesCompletion(!$editorSettings.tabNavigatesCompletion)}
            >
              <span aria-hidden="true"></span>
            </button>
          </div>
        </fieldset>
      </div>
    {:else}
      <div class="settings-content">
        <header>
          <h1 id="settings-title">{$t("settings.shortcuts.title")}</h1>
          <p>{$t("settings.shortcuts.subtitle")}</p>
        </header>

        <fieldset>
          <legend>{$t("settings.shortcuts.general")}</legend>
          <ul class="shortcut-list">
            {#each $shortcuts as shortcut (shortcut.id)}
              <li>
                <div class="shortcut-text">
                  <strong>{shortcutText(shortcut.id, "label")}</strong>
                  <span>{shortcutText(shortcut.id, "description")}</span>
                </div>

                <div class="shortcut-actions">
                  {#if recordingId === shortcut.id}
                    <button
                      class="record-target"
                      type="button"
                      use:focusOnMount
                      onkeydown={(event) => handleRecordKeydown(event, shortcut.id)}
                      onblur={() => (recordingId = null)}
                    >
                      {$t("settings.shortcuts.recording")}
                    </button>
                  {:else}
                    <kbd>{shortcut.keys}</kbd>
                    {#if shortcut.isCustom}
                      <button
                        class="shortcut-icon-button"
                        type="button"
                        aria-label={$t("settings.shortcuts.resetLabel", { name: shortcutText(shortcut.id, "label") })}
                        title={$t("settings.shortcuts.resetTitle")}
                        onclick={() => resetShortcutKeys(shortcut.id)}
                      >
                        <RotateCcw size={13} aria-hidden="true" />
                      </button>
                    {/if}
                    <button
                      class="shortcut-icon-button"
                      type="button"
                      aria-label={$t("settings.shortcuts.changeLabel", { name: shortcutText(shortcut.id, "label") })}
                      title={$t("settings.shortcuts.changeTitle")}
                      onclick={() => startRecording(shortcut.id)}
                    >
                      <Pencil size={13} aria-hidden="true" />
                    </button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </fieldset>
      </div>
    {/if}
  </div>
</section>
</dialog>

<style>
  dialog {
    width: min(56rem, calc(100vw - 4rem));
    height: min(34rem, calc(100vh - 4rem));
    max-width: none;
    max-height: none;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    box-shadow: var(--shadow-elevated);
  }

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
  .palette-option:focus-visible,
  .language-list button:focus-visible {
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
  .palette-option,
  .language-list button {
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
  .palette-option:hover,
  .language-list button:hover {
    border-color: var(--control-border);
  }

  .scheme-grid button.selected,
  .palette-option.selected,
  .language-list button.selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--surface-elevated) 92%, var(--accent));
  }

  .shortcut-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
  }

  .setting-row + .setting-row {
    margin-top: var(--space-2);
  }

  .setting-text {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: var(--space-1);
  }

  .setting-text label,
  .setting-label {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .setting-text span,
  .number-setting > span {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .number-setting {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--space-2);
  }

  .number-setting input {
    width: 4.5rem;
    padding: var(--space-2);
    border: 1px solid var(--control-border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    font: inherit;
    font-size: 0.8125rem;
  }

  .number-setting input:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

  .switch {
    position: relative;
    width: 2.25rem;
    height: 1.25rem;
    flex: 0 0 auto;
    padding: 2px;
    border: 1px solid var(--control-border);
    border-radius: 999px;
    background: var(--surface);
    cursor: pointer;
    transition:
      border-color var(--duration-fast),
      background-color var(--duration-fast);
  }

  .switch span {
    display: block;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    background: var(--text-secondary);
    transition:
      transform var(--duration-fast),
      background-color var(--duration-fast);
  }

  .switch.enabled {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 30%, var(--surface));
  }

  .switch.enabled span {
    transform: translateX(0.95rem);
    background: var(--accent);
  }

  .switch:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  code {
    color: var(--text-primary);
    font-family: inherit;
  }

  .shortcut-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-elevated);
  }

  .shortcut-text {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
  }

  .shortcut-text strong {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .shortcut-text span {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  kbd {
    flex-shrink: 0;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--control-border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.75rem;
  }

  .shortcut-actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--space-1);
  }

  .shortcut-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .shortcut-icon-button:hover {
    color: var(--text-primary);
    background: var(--surface);
    border-color: var(--border);
  }

  .shortcut-icon-button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

  .record-target {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--surface) 88%, var(--accent));
    color: var(--text-primary);
    font: inherit;
    font-size: 0.75rem;
    cursor: default;
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

  .language-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .language-list button {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0 var(--space-3);
    padding: var(--space-3);
    text-align: left;
  }

  .language-list strong {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .language-list span:not(.selection) {
    grid-column: 1;
    color: var(--text-secondary);
    font-size: 0.6875rem;
  }

  .language-list .selection {
    grid-row: 1 / span 2;
    grid-column: 2;
  }

  .palette-option.selected .selection,
  .language-list button.selected .selection {
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

    .setting-row {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
