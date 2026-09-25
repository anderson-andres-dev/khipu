import { browser } from "$app/environment";
import { writable } from "svelte/store";

// Tamaño de pagina por defecto del grid de resultados ("Establecer como
// predeterminado" en el selector de la barra de paginacion).
export const PAGE_SIZE_OPTIONS = [10, 100, 250, 500, 1000] as const;
export const FACTORY_PAGE_SIZE = 500;
// Mismo tope que MAX_QUERY_ROW_LIMIT en el backend: "Todas" pide esto.
export const MAX_PAGE_SIZE = 10_000;

const STORAGE_KEY = "khipu:result-page-size:v1";

export function clampPageSize(value: number): number {
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.round(value)));
}

function load(): number {
  if (!browser) return FACTORY_PAGE_SIZE;
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0 ? clampPageSize(stored) : FACTORY_PAGE_SIZE;
  } catch {
    return FACTORY_PAGE_SIZE;
  }
}

export const defaultPageSize = writable<number>(load());

if (browser) {
  defaultPageSize.subscribe((size) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(size));
    } catch {
      // Sin almacenamiento, el tamaño elegido dura solo esta sesion.
    }
  });
}
