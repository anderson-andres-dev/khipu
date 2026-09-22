import { browser } from "$app/environment";
import { writable } from "svelte/store";

const STORAGE_KEY = "khipu:editor-settings:v1";
export const DEFAULT_FORMATTER_LINE_WIDTH = 60;
export const MIN_FORMATTER_LINE_WIDTH = 20;
export const MAX_FORMATTER_LINE_WIDTH = 240;

export interface EditorSettings {
  formatterLineWidth: number;
  autoUppercaseKeywords: boolean;
  tabNavigatesCompletion: boolean;
}

function normalizeLineWidth(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_FORMATTER_LINE_WIDTH;
  return Math.min(MAX_FORMATTER_LINE_WIDTH, Math.max(MIN_FORMATTER_LINE_WIDTH, Math.round(value)));
}

function defaultEditorSettings(): EditorSettings {
  return { formatterLineWidth: DEFAULT_FORMATTER_LINE_WIDTH, autoUppercaseKeywords: true, tabNavigatesCompletion: true };
}

function loadEditorSettings(): EditorSettings {
  if (!browser) return defaultEditorSettings();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultEditorSettings();
    const parsed = JSON.parse(stored) as Partial<EditorSettings>;
    return {
      formatterLineWidth: normalizeLineWidth(parsed.formatterLineWidth),
      autoUppercaseKeywords: parsed.autoUppercaseKeywords !== false,
      tabNavigatesCompletion: parsed.tabNavigatesCompletion !== false,
    };
  } catch {
    return defaultEditorSettings();
  }
}

export const editorSettings = writable<EditorSettings>(loadEditorSettings());

if (browser) {
  editorSettings.subscribe((settings) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          formatterLineWidth: normalizeLineWidth(settings.formatterLineWidth),
          autoUppercaseKeywords: settings.autoUppercaseKeywords,
          tabNavigatesCompletion: settings.tabNavigatesCompletion,
        }),
      );
    } catch {
      // El editor sigue funcionando con el valor en memoria si no hay almacenamiento.
    }
  });
}

export function setFormatterLineWidth(value: number): void {
  editorSettings.update((settings) => ({
    ...settings,
    formatterLineWidth: normalizeLineWidth(value),
  }));
}

export function setAutoUppercaseKeywords(enabled: boolean): void {
  editorSettings.update((settings) => ({ ...settings, autoUppercaseKeywords: enabled }));
}

export function setTabNavigatesCompletion(enabled: boolean): void {
  editorSettings.update((settings) => ({ ...settings, tabNavigatesCompletion: enabled }));
}
