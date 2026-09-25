import { writable } from "svelte/store";

// Aviso breve y no bloqueante (p.ej. "no se pudo guardar el archivo"). Uno
// a la vez: un aviso nuevo reemplaza al anterior.
export interface Notice {
  id: number;
  message: string;
  kind: "error" | "success";
}

export const notice = writable<Notice | null>(null);

let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function show(message: string, kind: Notice["kind"]): void {
  const id = nextId++;
  notice.set({ id, message, kind });
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => dismissNotice(id), 6000);
}

export function notifyError(error: unknown): void {
  show(error instanceof Error ? error.message : String(error), "error");
}

export function notifySuccess(message: string): void {
  show(message, "success");
}

export function dismissNotice(id: number): void {
  notice.update((current) => (current?.id === id ? null : current));
}
