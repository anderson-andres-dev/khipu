import { browser } from "$app/environment";
import { get, writable } from "svelte/store";

const STORAGE_KEY = "khipu:query-consoles:v1";

export interface QueryConsole {
  id: string;
  profileId: string;
  title: string;
  sql: string;
}

interface QueryConsoleState {
  consoles: QueryConsole[];
  activeByProfile: Record<string, string>;
  nextOrdinal: number;
}

const EMPTY_STATE: QueryConsoleState = {
  consoles: [],
  activeByProfile: {},
  nextOrdinal: 1,
};

function parseConsole(value: unknown): QueryConsole | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<QueryConsole>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.profileId !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.sql !== "string"
  ) return null;
  return {
    id: candidate.id,
    profileId: candidate.profileId,
    title: candidate.title,
    sql: candidate.sql,
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
    title: `Consola ${state.nextOrdinal}`,
    sql: "",
  };
  return {
    id: item.id,
    state: {
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Una cuota llena no debe impedir seguir editando durante esta sesion.
    }
  });
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
  queryConsoles.update((state) => ({
    ...state,
    consoles: state.consoles.map((item) => (item.id === id ? { ...item, sql } : item)),
  }));
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
  const state = get(queryConsoles);
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
