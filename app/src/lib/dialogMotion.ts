// Cierre animado para TODOS los <dialog> de la app.
//
// La transicion de salida de tokens.css (opacity/transform + display y
// overlay con allow-discrete) no corre en WebKitGTK, el motor de Tauri en
// Linux: sin soporte de `overlay`, el dialogo sale de la capa superior en
// el acto y se corta en seco. En vez de depender de eso, close() se
// reemplaza una sola vez: marca el dialogo con .is-closing (la animacion de
// salida esta en tokens.css), espera a que termine y recien ahi cierra de
// verdad. El evento "close" sale al final, asi que quien reacciona a el
// (desmontar el componente, limpiar estado) lo hace con la animacion ya
// terminada.
//
// Esc tambien pasa por aca: el "cancel" nativo cerraria de golpe, asi que se
// cancela y se llama a close(). Los componentes que escuchan oncancel siguen
// recibiendolo igual.

const CLOSE_DURATION_MS = 150;

let installed = false;

export function installDialogMotion(): void {
  if (installed || typeof HTMLDialogElement === "undefined") return;
  installed = true;

  const nativeClose = HTMLDialogElement.prototype.close;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (!this.open || this.classList.contains("is-closing")) return;
    if (reducedMotion.matches || !this.isConnected) {
      nativeClose.call(this, returnValue);
      return;
    }
    this.classList.add("is-closing");
    window.setTimeout(() => {
      this.classList.remove("is-closing");
      if (this.open) nativeClose.call(this, returnValue);
    }, CLOSE_DURATION_MS);
  };

  document.addEventListener(
    "cancel",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLDialogElement)) return;
      event.preventDefault();
      // Despues de que el componente procese su propio oncancel (que suele
      // llamar a close() el mismo; el segundo llamado no hace nada).
      queueMicrotask(() => target.close());
    },
    true,
  );
}
