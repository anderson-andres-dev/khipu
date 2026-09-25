import { writable } from "svelte/store";

// Registro de la pestaña "Salida" de cada consola, al estilo del Output de
// DataGrip: cada sentencia ejecutada ("core> select ...") seguida de su
// resultado ("500 filas obtenidas desde la fila 1 en 429 ms") o su error.
// Transitorio como los resultados: no se persiste.
export type LogKind = "query" | "info" | "error";

export interface LogEntry {
  id: number;
  at: number;
  kind: LogKind;
  // Prefijo del prompt (schema) para las entradas "query".
  schema?: string;
  text: string;
}

// Tope por consola: el registro se muestra entero y crece con cada
// ejecucion; lo mas viejo se descarta.
const MAX_ENTRIES = 1000;

let nextId = 1;

export const executionLog = writable<Record<string, LogEntry[]>>({});

export function appendLog(consoleId: string, entry: Omit<LogEntry, "id" | "at"> & { at?: number }): void {
  const full: LogEntry = { id: nextId++, at: entry.at ?? Date.now(), ...entry };
  executionLog.update((state) => {
    const current = state[consoleId] ?? [];
    const next = current.length >= MAX_ENTRIES ? [...current.slice(-(MAX_ENTRIES - 1)), full] : [...current, full];
    return { ...state, [consoleId]: next };
  });
}

export function forgetLog(consoleId: string): void {
  executionLog.update((state) => {
    const { [consoleId]: _removed, ...rest } = state;
    return rest;
  });
}
