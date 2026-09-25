import { browser } from "$app/environment";
import { derived, writable } from "svelte/store";

// Catalogo de atajos de teclado de la app. La accion real de cada uno vive
// donde corresponde su estado (p.ej. el toggle del sidebar en
// +layout.svelte); este modulo solo sabe el id/etiqueta/tecla por defecto y
// persiste los overrides que el usuario reasigne en Ajustes > Atajos.
export interface ShortcutDefinition {
  id: string;
  label: string;
  description: string;
  defaultKeys: string;
}

export const shortcutDefinitions: ShortcutDefinition[] = [
  {
    id: "toggle-sidebar",
    label: "Ocultar panel de tablas",
    description: "Muestra u oculta el arbol de tablas del sidebar.",
    defaultKeys: "Alt+1",
  },
  {
    id: "select-all",
    label: "Seleccionar todo",
    description: "Selecciona todo el texto del editor SQL.",
    defaultKeys: "Ctrl+A",
  },
  {
    id: "new-query-console",
    label: "Nueva consola SQL",
    description: "Crea y activa una consola temporal para la conexion actual.",
    defaultKeys: "Ctrl+Shift+Q",
  },
  {
    id: "rename-query-console",
    label: "Cambiar nombre de consola",
    description: "Edita el nombre de la consola SQL activa.",
    defaultKeys: "Shift+F6",
  },
  {
    id: "save-query-console",
    label: "Guardar",
    description: "Guarda el archivo activo; en una consola, pide donde guardarla como .sql.",
    defaultKeys: "Ctrl+S",
  },
  {
    id: "save-query-console-as",
    label: "Guardar como",
    description: "Guarda la pestaña activa como un archivo .sql nuevo.",
    defaultKeys: "Ctrl+Shift+S",
  },
  {
    id: "open-sql-file",
    label: "Abrir archivo SQL",
    description: "Abre un archivo .sql del disco en una pestaña nueva.",
    defaultKeys: "Ctrl+O",
  },
  {
    id: "close-query-console",
    label: "Cerrar consola",
    description: "Pide confirmacion antes de cerrar la consola SQL activa.",
    defaultKeys: "Ctrl+F4",
  },
  {
    id: "format-sql",
    label: "Formatear SQL",
    description: "Formatea la seleccion o la consulta donde esta el cursor.",
    defaultKeys: "Ctrl+L",
  },
  {
    id: "next-result-page",
    label: "Página siguiente",
    description: "Muestra la siguiente página del resultado.",
    defaultKeys: "Ctrl+Alt+ArrowDown",
  },
  {
    id: "previous-result-page",
    label: "Página anterior",
    description: "Muestra la página anterior del resultado.",
    defaultKeys: "Ctrl+Alt+ArrowUp",
  },
  {
    id: "execute-query",
    label: "Ejecutar consulta",
    description: "Ejecuta la seleccion o la sentencia donde esta el cursor.",
    defaultKeys: "Ctrl+Enter",
  },
];

const STORAGE_KEY = "khipu:shortcut-overrides";

function loadOverrides(): Record<string, string> {
  if (!browser) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return {};

    const overrides: Record<string, string> = {};
    for (const [id, keys] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof keys === "string") overrides[id] = keys;
    }
    return overrides;
  } catch {
    return {};
  }
}

const shortcutOverrides = writable<Record<string, string>>(loadOverrides());

if (browser) {
  shortcutOverrides.subscribe((overrides) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // La falta de almacenamiento no debe impedir usar el atajo por defecto.
    }
  });
}

export interface ResolvedShortcut extends ShortcutDefinition {
  keys: string;
  isCustom: boolean;
}

// Lista lista para pintar en Ajustes > Atajos: cada definicion con su tecla
// vigente (override si existe, si no la de fabrica).
export const shortcuts = derived(shortcutOverrides, (overrides) =>
  shortcutDefinitions.map(
    (definition): ResolvedShortcut => ({
      ...definition,
      keys: overrides[definition.id] ?? definition.defaultKeys,
      isCustom: definition.id in overrides,
    }),
  ),
);

export function setShortcutKeys(id: string, keys: string): void {
  shortcutOverrides.update((overrides) => ({ ...overrides, [id]: keys }));
}

export function resetShortcutKeys(id: string): void {
  shortcutOverrides.update((overrides) => {
    const { [id]: _removed, ...rest } = overrides;
    return rest;
  });
}

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

// Normaliza un KeyboardEvent a un string estable como "Ctrl+Alt+1" para
// guardar/comparar atajos. Devuelve null mientras solo se sostiene un
// modificador (todavia no hay una tecla "principal" que capturar).
export function formatShortcutEvent(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;

  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Meta");

  const key = event.key;
  parts.push(key.length === 1 ? key.toUpperCase() : key);

  return parts.join("+");
}

export function eventMatchesShortcut(event: KeyboardEvent, keys: string): boolean {
  return formatShortcutEvent(event) === keys;
}

// Traduce nuestro formato ("Ctrl+A") al que espera keymap.of() de CodeMirror
// ("Ctrl-a": modificadores y tecla base separados por guion, base en
// minuscula cuando es una sola letra).
export function toCodeMirrorKey(keys: string): string {
  const parts = keys.split("+");
  const base = parts.pop() ?? "";
  const normalizedBase = base.length === 1 ? base.toLowerCase() : base;
  return [...parts, normalizedBase].join("-");
}
