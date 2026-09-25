import { writable } from "svelte/store";

// Aviso breve y no bloqueante (p.ej. "no se pudo guardar el archivo"). Uno
// a la vez: un aviso nuevo reemplaza al anterior.
export interface Notice {
  id: number;
  message: string;
}

export const notice = writable<Notice | null>(null);

let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function notifyError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const id = nextId++;
  notice.set({ id, message });
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => dismissNotice(id), 6000);
}

export function dismissNotice(id: number): void {
  notice.update((current) => (current?.id === id ? null : current));
}
