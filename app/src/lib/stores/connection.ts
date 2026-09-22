import { get, writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";
import type { CatalogTable } from "$lib/types";
import { getDriver } from "$lib/connections";
import { loadConnectionPassword } from "$lib/credentials";
import type { ConnectionProfile } from "./connectionProfiles";

export interface ConnectionState {
  // true = el ultimo connect() cargo un catalogo con exito. NO implica que
  // haya una conexion de base de datos viva: el backend descarta el pool
  // despues de introspectar (ver drivers.rs). No usar este flag para asumir
  // que se puede seguir consultando la base sin volver a llamar a connect().
  connected: boolean;
  connecting: boolean;
  tableCount: number | null;
  profileId: string | null;
  error: string | null;
}

const initialState: ConnectionState = {
  connected: false,
  connecting: false,
  tableCount: null,
  profileId: null,
  error: null,
};

export const connection = writable<ConnectionState>(initialState);

// Tablas del catalogo cargado por el ultimo connect() exitoso. Se usa tanto
// para el arbol de tablas del sidebar (SchemaTree.svelte) como para el
// autocompletado del editor (SqlEditor.svelte via sqlSchema.ts) - no hay
// comando de Tauri aparte para sugerencias, el catalogo ya viaja completo.
export const catalogTables = writable<CatalogTable[]>([]);

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export async function connect(
  kind: "mysql" | "postgres",
  config: ConnectionConfig,
): Promise<number | null> {
  connection.update((state) => ({ ...state, connecting: true, error: null }));

  try {
    const tableCount = await invoke<number>("connect", { kind, config });
    catalogTables.set(await invoke<CatalogTable[]>("list_tables"));
    return tableCount;
  } catch (e) {
    connection.update((state) => ({
      ...state,
      connected: false,
      error: String(e),
    }));
    return null;
  } finally {
    connection.update((state) => ({ ...state, connecting: false }));
  }
}

export function completeConnection(tableCount: number, profileId: string): void {
  connection.update((state) => ({
    ...state,
    connected: true,
    tableCount,
    profileId,
    error: null,
  }));
}

type ConnectResult =
  | { ok: true }
  | { ok: false; reason: "no-password" }
  | { ok: false; reason: "connect-failed"; error: string };

// Orquesta el flujo completo de conectar a un perfil guardado (carga de
// contrasena + connect() + completeConnection()) para que la tarjeta de la
// landing y el selector del topbar compartan exactamente la misma logica.
export async function connectToProfile(profile: ConnectionProfile): Promise<ConnectResult> {
  let password: string | null;
  try {
    password = await loadConnectionPassword(profile.id, profile.passwordPolicy);
  } catch {
    password = null;
  }
  if (password === null) return { ok: false, reason: "no-password" };

  const driver = getDriver(profile.driver);
  const tableCount = await connect(driver.backendKind, {
    host: profile.host,
    port: profile.port,
    database: profile.database,
    username: profile.username,
    password,
  });
  if (tableCount === null) {
    return { ok: false, reason: "connect-failed", error: get(connection).error ?? "" };
  }

  completeConnection(tableCount, profile.id);
  return { ok: true };
}

// Puente para que el selector de conexiones del topbar (+layout.svelte) le
// pida a +page.svelte que abra el modal de edicion con contexto cuando un
// cambio de conexion falla, sin acoplar el layout al estado local de la
// pagina.
export const pendingEdit = writable<{ profile: ConnectionProfile; error: string | null } | null>(
  null,
);

export async function testConnection(
  kind: "mysql" | "postgres",
  config: ConnectionConfig,
): Promise<void> {
  await invoke("test_connection", { kind, config });
}

// reset() SOLO limpia el estado del lado del frontend. No existe un comando
// de Tauri para "desconectar" o descartar el catalogo en AppState hoy, asi
// que esto no llama a invoke(): reconectar es simplemente volver a llamar a
// connect().
export function reset(): void {
  connection.set(initialState);
  catalogTables.set([]);
}
