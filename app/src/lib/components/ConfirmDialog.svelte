<script lang="ts">
  import { tick } from "svelte";
  import { TriangleAlert } from "@lucide/svelte";

  // Confirmacion destructiva centrada (icono, titulo, mensaje y dos botones
  // del mismo tamaño), con la misma pinta que el modal de cerrar consola.
  let {
    title,
    message,
    confirmLabel,
    onconfirm,
    oncancel,
  }: {
    title: string;
    message: string;
    confirmLabel: string;
    onconfirm: () => void;
    oncancel: () => void;
  } = $props();

  let dialog = $state<HTMLDialogElement>();

  $effect(() => {
    void tick().then(() => {
      dialog?.showModal();
      // Foco en el dialogo, no en un boton: un Enter accidental no confirma.
      dialog?.focus();
    });
  });

  // La respuesta se entrega en el evento close, que llega cuando termino la
  // animacion de salida (dialogMotion.ts): el padre desmonta el componente
  // recien ahi, sin cortar la animacion.
  let answer: "confirm" | "cancel" = "cancel";

  function cancel() {
    answer = "cancel";
    dialog?.close();
  }

  function confirm() {
    answer = "confirm";
    dialog?.close();
  }

  function onClosed() {
    if (answer === "confirm") onconfirm();
    else oncancel();
  }
</script>

<dialog
  class="confirm-dialog"
  tabindex="-1"
  bind:this={dialog}
  oncancel={(event) => {
    event.preventDefault();
    cancel();
  }}
  onclose={onClosed}
>
  <div class="icon" aria-hidden="true">
    <TriangleAlert size={24} strokeWidth={2} />
  </div>
  <h2>{title}</h2>
  <p>{message}</p>
  <div class="actions">
    <button type="button" class="secondary-action" onclick={cancel}>Cancelar</button>
    <button type="button" class="danger-action" onclick={confirm}>{confirmLabel}</button>
  </div>
</dialog>

<style>
  .confirm-dialog {
    width: min(24rem, calc(100vw - 2rem));
    padding: 2rem 1.75rem 1.75rem;
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
    color: var(--text-primary);
    text-align: center;
    outline: none;
  }

  .confirm-dialog[open] {
    animation: dialog-in 180ms cubic-bezier(0.2, 0.9, 0.3, 1);
  }

  @keyframes dialog-in {
    from {
      opacity: 0;
      transform: translateY(4px) scale(0.97);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .confirm-dialog[open] {
      animation: none;
    }
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1.25rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--warning) 14%, transparent);
    color: var(--warning);
  }

  h2 {
    margin: 0;
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--tracking-heading);
  }

  p {
    margin: var(--space-2) 0 1.75rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.625rem;
  }

  .actions button {
    height: 2.5rem;
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .secondary-action {
    background: color-mix(in srgb, var(--text-primary) 9%, var(--surface-elevated));
    color: var(--text-primary);
  }

  .secondary-action:hover {
    background: color-mix(in srgb, var(--text-primary) 14%, var(--surface-elevated));
  }

  .danger-action {
    background: #e5484d;
    color: #fff;
  }

  .danger-action:hover {
    background: #ec5d5e;
  }

  .actions button:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
</style>
