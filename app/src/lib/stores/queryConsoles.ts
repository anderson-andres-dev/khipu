import { browser } from "$app/environment";
import { get, writable } from "svelte/store";
import type { DestructiveStatement, QueryExecutionResult } from "$lib/types";

const STORAGE_KEY = "khipu:query-consoles:v1";

export interface QueryConsole {
  id: string;
  profileId: string;
  title: string;
  sql: string;
  // Ruta absoluta del .sql en disco si la pestaña es un archivo; null para
  // una consola. Consolas y archivos usan el mismo editor y se ejecutan
  // igual contra la conexion activa.
  filePath: string | null;
  // Contenido del archivo tal como esta en disco (ultimo abierto/guardado).
  // El texto en edicion (sql) se persiste igual en cada tecla para no
  // perder nada al recargar; la pestaña marca cambios mientras difieren.
  // En una consola no se usa.
  savedSql: string;
}

export interface PendingQueryConfirmation {
  sql: string;
  statement: DestructiveStatement;
}

// Estado transitorio de ejecucion por consola. Vive en el mismo store que
// QueryConsole por comodidad, pero nunca se persiste (ver el subscribe() mas
// abajo, que serializa solo un subconjunto de campos): resultados y
// confirmaciones pendientes no deben sobrevivir a un refresh ni ocupar
// localStorage con datos de la base.
export interface QueryExecutionState {
  isExecuting: boolean;
  result: QueryExecutionResult | null;
  // El SQL que produjo `result`, capturado en la ejecucion — no el texto
  // vigente del editor, que puede haber cambiado desde entonces. Sirve para
  // rotular a que consulta pertenece el resultado (p.ej. de que tabla es).
  resultSql: string | null;
  // Momento (epoch ms) en que termino la ejecucion que produjo `result`:
  // el panel de resultados lo muestra como marca de tiempo del log.
  resultAt: number | null;
  pendingConfirmation: PendingQueryConfirmation | null;
}

const EMPTY_EXECUTION_STATE: QueryExecutionState = {
  isExecuting: false,
  result: null,
  resultSql: null,
  resultAt: null,
  pendingConfirmation: null,
};

interface QueryConsoleState {
  consoles: QueryConsole[];
  activeByProfile: Record<string, string>;
  nextOrdinal: number;
  executionByConsole: Record<string, QueryExecutionState>;
}

const EMPTY_STATE: QueryConsoleState = {
  consoles: [],
  activeByProfile: {},
  nextOrdinal: 1,
  executionByConsole: {},
};

function consoleTitle(ordinal: number): string {
  return `consola_${ordinal}`;
}

function parseConsole(value: unknown): QueryConsole | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<QueryConsole>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.profileId !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.sql !== "string"
  ) return null;
  // Consolas de antes del nombre "consola_N" pasan al formato nuevo; las
  // renombradas a mano se respetan.
  const legacyOrdinal = /^Consola (\d+)$/.exec(candidate.title)?.[1];
  return {
    id: candidate.id,
    profileId: candidate.profileId,
    title: legacyOrdinal ? consoleTitle(Number(legacyOrdinal)) : candidate.title,
    sql: candidate.sql,
    filePath: typeof candidate.filePath === "string" ? candidate.filePath : null,
    savedSql: typeof candidate.savedSql === "string" ? candidate.savedSql : candidate.sql,
  };
}

function loadState(): QueryConsoleState {
  if (!browser) return EMPTY_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_STATE;

    const candidate = parsed as Partial<QueryConsoleState>;
    const consoles = Array.isArray(candidate.consoles)
      ? candidate.consoles.map(parseConsole).filter((item): item is QueryConsole => item !== null)
      : [];
    const ids = new Set(consoles.map((item) => item.id));
    const activeByProfile: Record<string, string> = {};
    if (candidate.activeByProfile && typeof candidate.activeByProfile === "object") {
      for (const [profileId, id] of Object.entries(candidate.activeByProfile)) {
        if (typeof id === "string" && ids.has(id)) activeByProfile[profileId] = id;
      }
    }

    return {
      consoles,
      activeByProfile,
      nextOrdinal:
        typeof candidate.nextOrdinal === "number" && Number.isSafeInteger(candidate.nextOrdinal) && candidate.nextOrdinal > 0
          ? candidate.nextOrdinal
          : consoles.length + 1,
      executionByConsole: {},
    };
  } catch {
    return EMPTY_STATE;
  }
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `console-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function appendConsole(state: QueryConsoleState, profileId: string): { state: QueryConsoleState; id: string } {
  const item: QueryConsole = {
    id: createId(),
    profileId,
    title: consoleTitle(state.nextOrdinal),
    sql: "",
    filePath: null,
    savedSql: "",
  };
  return {
    id: item.id,
    state: {
      ...state,
      consoles: [...state.consoles, item],
      activeByProfile: { ...state.activeByProfile, [profileId]: item.id },
      nextOrdinal: state.nextOrdinal + 1,
    },
  };
}

export const queryConsoles = writable<QueryConsoleState>(loadState());

if (browser) {
  queryConsoles.subscribe((state) => {
    try {
      // executionByConsole (resultados, "ejecutando", confirmaciones
      // pendientes) es intencionalmente transitorio: nunca se guarda.
      const { consoles, activeByProfile, nextOrdinal } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ consoles, activeByProfile, nextOrdinal }));
    } catch {
      // Una cuota llena no debe impedir seguir editando durante esta sesion.
    }
  });
}

// Estado de ejecucion vigente de una consola dentro de un snapshot del store
// (nunca undefined: una consola sin actividad reciente se ve como "sin
// ejecutar"). Pensado para usarse reactivamente, p.ej.
// `executionForConsole($queryConsoles, activeConsole.id)`.
export function executionForConsole(state: QueryConsoleState, consoleId: string): QueryExecutionState {
  return state.executionByConsole[consoleId] ?? EMPTY_EXECUTION_STATE;
}

function withExecution(
  state: QueryConsoleState,
  consoleId: string,
  patch: Partial<QueryExecutionState>,
): QueryConsoleState {
  return {
    ...state,
    executionByConsole: {
      ...state.executionByConsole,
      [consoleId]: { ...executionForConsole(state, consoleId), ...patch },
    },
  };
}

function withoutExecution(state: QueryConsoleState, consoleId: string): QueryConsoleState {
  const { [consoleId]: _removed, ...rest } = state.executionByConsole;
  return { ...state, executionByConsole: rest };
}

// Marca la consola como ejecutando. Devuelve false (y no toca el estado) si
// esa consola ya esta ocupada (ejecutando o con una confirmacion pendiente),
// para que un doble disparo no inicie una segunda ejecucion superpuesta.
export function beginQueryExecution(consoleId: string): boolean {
  const current = executionForConsole(get(queryConsoles), consoleId);
  if (current.isExecuting || current.pendingConfirmation) return false;

  queryConsoles.update((state) => withExecution(state, consoleId, { isExecuting: true }));
  return true;
}

export function finishQueryExecution(consoleId: string, sql: string, result: QueryExecutionResult): void {
  queryConsoles.update((state) =>
    withExecution(state, consoleId, { isExecuting: false, result, resultSql: sql, resultAt: Date.now(), pendingConfirmation: null }),
  );
}

export function requireQueryConfirmation(consoleId: string, pending: PendingQueryConfirmation): void {
  queryConsoles.update((state) =>
    withExecution(state, consoleId, { isExecuting: false, pendingConfirmation: pending }),
  );
}

export function cancelQueryConfirmation(consoleId: string): void {
  queryConsoles.update((state) => withExecution(state, consoleId, { pendingConfirmation: null }));
}

// Extrae la confirmacion pendiente y la retira en la misma actualizacion, de
// forma atomica: una segunda llamada (p.ej. un doble click) recibe null en
// vez de la misma confirmacion dos veces.
export function takeQueryConfirmation(consoleId: string): PendingQueryConfirmation | null {
  let taken: PendingQueryConfirmation | null = null;
  queryConsoles.update((state) => {
    const pending = executionForConsole(state, consoleId).pendingConfirmation;
    if (!pending) return state;
    taken = pending;
    return withExecution(state, consoleId, { pendingConfirmation: null });
  });
  return taken;
}

export function ensureQueryConsole(profileId: string): string {
  const state = get(queryConsoles);
  const existing = state.consoles.filter((item) => item.profileId === profileId);
  const active = state.activeByProfile[profileId];
  if (active && existing.some((item) => item.id === active)) return active;
  if (existing.length > 0) {
    queryConsoles.update((current) => ({
      ...current,
      activeByProfile: { ...current.activeByProfile, [profileId]: existing[0].id },
    }));
    return existing[0].id;
  }

  const created = appendConsole(state, profileId);
  queryConsoles.set(created.state);
  return created.id;
}

export function createQueryConsole(profileId: string): string {
  const created = appendConsole(get(queryConsoles), profileId);
  queryConsoles.set(created.state);
  return created.id;
}

export function activateQueryConsole(profileId: string, id: string): void {
  queryConsoles.update((state) => {
    if (!state.consoles.some((item) => item.id === id && item.profileId === profileId)) return state;
    return { ...state, activeByProfile: { ...state.activeByProfile, [profileId]: id } };
  });
}

export function updateQueryConsoleSql(id: string, sql: string): void {
  queryConsoles.update((state) => {
    const next = {
      ...state,
      consoles: state.consoles.map((item) => (item.id === id ? { ...item, sql } : item)),
    };
    // Editar el SQL invalida cualquier confirmacion pendiente de esa consola
    // (era para un texto que ya no es el actual); el resultado anterior, en
    // cambio, se conserva hasta la proxima ejecucion.
    return executionForConsole(next, id).pendingConfirmation
      ? withExecution(next, id, { pendingConfirmation: null })
      : next;
  });
}

// Un archivo tiene cambios sin guardar si su texto difiere de lo que hay en
// disco. Una consola, en cuanto tiene texto: todavia no esta en ningun
// archivo (su contenido solo sobrevive dentro de la app mientras siga
// abierta).
export function isQueryConsoleDirty(item: QueryConsole): boolean {
  return item.filePath !== null ? item.sql !== item.savedSql : item.sql.trim() !== "";
}

export function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

// Registra que la pestaña se guardo en `filePath` con el contenido `sql`
// (el que efectivamente se escribio, que puede ser anterior al texto actual
// si el usuario siguio tecleando mientras se guardaba). Una consola pasa a
// ser un archivo y toma el nombre de este.
export function markQueryConsoleSaved(id: string, filePath: string, sql: string): void {
  queryConsoles.update((state) => ({
    ...state,
    consoles: state.consoles.map((item) =>
      item.id === id ? { ...item, filePath, savedSql: sql, title: fileNameFromPath(filePath) } : item,
    ),
  }));
}

// El archivo cambio de ruta (renombrado desde la pestaña o desde el arbol
// de archivos): toda pestaña que lo tuviera abierto sigue apuntandolo.
export function retargetQueryConsoleFile(oldPath: string, newPath: string): void {
  queryConsoles.update((state) => ({
    ...state,
    consoles: state.consoles.map((item) =>
      item.filePath === oldPath ? { ...item, filePath: newPath, title: fileNameFromPath(newPath) } : item,
    ),
  }));
}

// El archivo ya no existe (se mando a la papelera): sus pestañas abiertas
// vuelven a ser consolas con el mismo texto, asi no se pierde nada y quedan
// marcadas como sin guardar.
export function detachQueryConsoleFile(path: string): void {
  queryConsoles.update((state) => ({
    ...state,
    consoles: state.consoles.map((item) => (item.filePath === path ? { ...item, filePath: null } : item)),
  }));
}

// Abre un .sql como pestaña. Si ya estaba abierto en esta conexion, solo lo
// activa (sin pisar lo que se este editando).
export function openSqlFileConsole(profileId: string, filePath: string, contents: string): string {
  const state = get(queryConsoles);
  const existing = state.consoles.find((item) => item.profileId === profileId && item.filePath === filePath);
  if (existing) {
    activateQueryConsole(profileId, existing.id);
    return existing.id;
  }
  const item: QueryConsole = {
    id: createId(),
    profileId,
    title: fileNameFromPath(filePath),
    sql: contents,
    filePath,
    savedSql: contents,
  };
  queryConsoles.set({
    ...state,
    consoles: [...state.consoles, item],
    activeByProfile: { ...state.activeByProfile, [profileId]: item.id },
  });
  return item.id;
}

export function renameQueryConsole(id: string, title: string): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  queryConsoles.update((state) => ({
    ...state,
    consoles: state.consoles.map((item) => (item.id === id ? { ...item, title: trimmed } : item)),
  }));
}

export function closeQueryConsole(profileId: string, id: string): void {
  const state = withoutExecution(get(queryConsoles), id);
  const profileConsoles = state.consoles.filter((item) => item.profileId === profileId);
  const closedIndex = profileConsoles.findIndex((item) => item.id === id);
  if (closedIndex === -1) return;

  const remaining = profileConsoles.filter((item) => item.id !== id);
  if (remaining.length === 0) {
    const withoutClosed = {
      ...state,
      consoles: state.consoles.filter((item) => item.id !== id),
    };
    queryConsoles.set(appendConsole(withoutClosed, profileId).state);
    return;
  }

  const currentActive = state.activeByProfile[profileId];
  const nextActive = currentActive === id
    ? remaining[Math.min(closedIndex, remaining.length - 1)].id
    : currentActive;
  queryConsoles.set({
    ...state,
    consoles: state.consoles.filter((item) => item.id !== id),
    activeByProfile: { ...state.activeByProfile, [profileId]: nextActive },
  });
}
