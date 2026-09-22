import { writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";

export interface ConnectionState {
  // true = el ultimo connect() cargo un catalogo con exito. NO implica que
  // haya una conexion de base de datos viva: el backend descarta el pool
  // despues de introspectar (ver drivers.rs). No usar este flag para asumir
  // que se puede seguir consultando la base sin volver a llamar a connect().
  connected: boolean;
  connecting: boolean;
  tableCount: number | null;
  error: string | null;
}

const initialState: ConnectionState = {
  connected: false,
  connecting: false,
  tableCount: null,
  error: null,
};

export const connection = writable<ConnectionState>(initialState);

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export async function connect(kind: "mysql" | "postgres", config: ConnectionConfig): Promise<void> {
  connection.update((state) => ({ ...state, connecting: true, error: null }));

  try {
    const tableCount = await invoke<number>("connect", { kind, config });
    connection.update((state) => ({
      ...state,
      connected: true,
      tableCount,
      error: null,
    }));
  } catch (e) {
    connection.update((state) => ({
      ...state,
      connected: false,
      error: String(e),
    }));
  } finally {
    connection.update((state) => ({ ...state, connecting: false }));
  }
}

// reset() SOLO limpia el estado del lado del frontend. No existe un comando
// de Tauri para "desconectar" o descartar el catalogo en AppState hoy, asi
// que esto no llama a invoke(): reconectar es simplemente volver a llamar a
// connect().
export function reset(): void {
  connection.set(initialState);
}
