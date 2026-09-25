import { browser } from "$app/environment";
import { writable } from "svelte/store";

// Carpeta de scripts .sql abierta en el sidebar, una por conexion (p.ej.
// prod -> ~/sql/prod), mas el alto del panel de archivos y si esta
// plegado. Todo se persiste: al volver a conectar, la carpeta sigue ahi.
export interface SqlFolderState {
  folderByProfile: Record<string, string>;
  // Carpetas expandidas en el arbol, por conexion.
  expandedByProfile: Record<string, string[]>;
  panelHeight: number;
  collapsed: boolean;
}

const STORAGE_KEY = "khipu:sql-folders:v1";
export const DEFAULT_FILE_PANEL_HEIGHT = 240;
export const MIN_FILE_PANEL_HEIGHT = 96;

const EMPTY: SqlFolderState = {
  folderByProfile: {},
  expandedByProfile: {},
  panelHeight: DEFAULT_FILE_PANEL_HEIGHT,
  collapsed: false,
};

function stringRecord(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) if (typeof item === "string") result[key] = item;
  }
  return result;
}

function listRecord(value: unknown): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (Array.isArray(item)) result[key] = item.filter((path): path is string => typeof path === "string");
    }
  }
  return result;
}

function load(): SqlFolderState {
  if (!browser) return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<SqlFolderState>;
    return {
      folderByProfile: stringRecord(parsed.folderByProfile),
      expandedByProfile: listRecord(parsed.expandedByProfile),
      panelHeight:
        typeof parsed.panelHeight === "number" && parsed.panelHeight >= MIN_FILE_PANEL_HEIGHT
          ? parsed.panelHeight
          : DEFAULT_FILE_PANEL_HEIGHT,
      collapsed: parsed.collapsed === true,
    };
  } catch {
    return EMPTY;
  }
}

export const sqlFolders = writable<SqlFolderState>(load());

if (browser) {
  sqlFolders.subscribe((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Sin almacenamiento, la carpeta vive solo durante la sesion.
    }
  });
}

export function setSqlFolder(profileId: string, path: string): void {
  sqlFolders.update((state) => ({
    ...state,
    folderByProfile: { ...state.folderByProfile, [profileId]: path },
    expandedByProfile: { ...state.expandedByProfile, [profileId]: [] },
    collapsed: false,
  }));
}

export function closeSqlFolder(profileId: string): void {
  sqlFolders.update((state) => {
    const { [profileId]: _folder, ...folderByProfile } = state.folderByProfile;
    const { [profileId]: _expanded, ...expandedByProfile } = state.expandedByProfile;
    return { ...state, folderByProfile, expandedByProfile };
  });
}

export function setSqlFolderExpanded(profileId: string, path: string, expanded: boolean): void {
  sqlFolders.update((state) => {
    const current = state.expandedByProfile[profileId] ?? [];
    const next = expanded ? [...new Set([...current, path])] : current.filter((item) => item !== path);
    return { ...state, expandedByProfile: { ...state.expandedByProfile, [profileId]: next } };
  });
}

export function setFilePanelHeight(height: number): void {
  sqlFolders.update((state) => ({ ...state, panelHeight: Math.max(MIN_FILE_PANEL_HEIGHT, Math.round(height)) }));
}

export function setFilePanelCollapsed(collapsed: boolean): void {
  sqlFolders.update((state) => ({ ...state, collapsed }));
}
