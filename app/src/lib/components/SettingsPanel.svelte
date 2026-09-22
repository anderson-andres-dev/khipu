<script lang="ts">
  import Field from "./Field.svelte";
  import { themeChoice } from "$lib/theming/theme";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let dialogEl: HTMLDialogElement | undefined = $state();

  // Estado local para los dos <select>. No se bindea directo a una
  // propiedad anidada del store (`$themeChoice.family`/`$themeChoice.scheme`)
  // porque son dos campos separados del mismo objeto — en su lugar, cada
  // dirección de sincronización es un efecto explícito con guarda, y la
  // escritura al store siempre pasa por `themeChoice.update(...)`.
  let familyValue = $state($themeChoice.family);
  let schemeValue = $state($themeChoice.scheme);

  $effect(() => {
    if (familyValue !== $themeChoice.family) familyValue = $themeChoice.family;
  });
  $effect(() => {
    if (schemeValue !== $themeChoice.scheme) schemeValue = $themeChoice.scheme;
  });
  $effect(() => {
    if (familyValue !== $themeChoice.family) {
      themeChoice.update((c) => ({ ...c, family: familyValue }));
    }
  });
  $effect(() => {
    if (schemeValue !== $themeChoice.scheme) {
      themeChoice.update((c) => ({ ...c, scheme: schemeValue }));
    }
  });

  // Sincroniza el <dialog> nativo con la prop bindeable `open`.
  $effect(() => {
    if (!dialogEl) return;
    if (open) {
      if (!dialogEl.open) dialogEl.showModal();
    } else if (dialogEl.open) {
      dialogEl.close();
    }
  });

  // El <dialog> se cierra por su cuenta (Escape -> `cancel` -> `close`, o
  // `dialogEl.close()` llamado desde el click de backdrop más abajo). En
  // cualquier caso, este evento nativo es la única fuente de verdad para
  // volver a poner `open` en false.
  function handleClose() {
    open = false;
  }

  // Con <dialog>, el propio elemento cubre el área de backdrop: si el click
  // fue dentro del contenido, e.target es un hijo, nunca el dialog mismo.
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialogEl) {
      dialogEl?.close();
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  aria-labelledby="settings-title"
  onclose={handleClose}
  onclick={handleBackdropClick}
>
  <h2 id="settings-title">Ajustes</h2>

  <div class="fields">
    <Field
      label="Tema"
      id="settings-theme-family"
      type="select"
      bind:value={familyValue}
      options={[
        { value: "datagrip", label: "DataGrip" },
        { value: "vscode", label: "VS Code" }
      ]}
    />

    <Field
      label="Apariencia"
      id="settings-theme-scheme"
      type="select"
      bind:value={schemeValue}
      options={[
        { value: "system", label: "Sistema" },
        { value: "light", label: "Claro" },
        { value: "dark", label: "Oscuro" }
      ]}
    />
  </div>
</dialog>

<style>
  dialog {
    min-width: 20rem;
    max-width: 28rem;
    padding: var(--space-6);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    color: var(--text-primary);
    box-shadow: var(--shadow-elevated);
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }

  h2 {
    margin: 0 0 var(--space-5);
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--tracking-heading);
    line-height: var(--leading-heading);
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
</style>
