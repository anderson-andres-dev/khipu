import { writable, derived, type Readable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
	THEME_FAMILIES,
	resolveScheme,
	themeVariant,
	type ShellPalette,
	type EditorPalette,
	type ThemeFamily,
	type ColorScheme
} from './palettes';

export type SchemePreference = 'system' | 'dark' | 'light';

export interface ThemeChoice {
	family: ThemeFamily;
	scheme: SchemePreference;
}

const STORAGE_KEY = 'khipu:theme';
const DEFAULT_THEME_CHOICE: ThemeChoice = { family: 'datagrip', scheme: 'system' };

// Mapeo campo de ShellPalette -> variable CSS `--palette-*`. Usado tanto por
// initThemeEffects() como (con el mismo nombre, duplicado literal) por el
// script inline de app.html.
const SHELL_PALETTE_CSS_VARS: Record<keyof ShellPalette, string> = {
	surface: '--palette-surface',
	surfaceElevated: '--palette-surface-elevated',
	surfaceHover: '--palette-surface-hover',
	surfaceContent: '--palette-surface-content',
	border: '--palette-border',
	gridLine: '--palette-grid-line',
	controlBorder: '--palette-control-border',
	textPrimary: '--palette-text-primary',
	textSecondary: '--palette-text-secondary',
	textOnAccent: '--palette-text-on-accent',
	accent: '--palette-accent',
	accentHover: '--palette-accent-hover',
	danger: '--palette-danger',
	dangerSolid: '--palette-danger-solid',
	dangerSolidHover: '--palette-danger-solid-hover',
	success: '--palette-success',
	warning: '--palette-warning',
	keyPrimary: '--palette-key-primary',
	controlDisabled: '--palette-control-disabled',
	focusRing: '--palette-focus-ring',
	shadow: '--palette-shadow',
	scrim: '--palette-scrim',
	scrollbarThumb: '--palette-scrollbar-thumb',
	scrollbarThumbHover: '--palette-scrollbar-thumb-hover',
	topbarBackground: '--palette-topbar-background'
};

// --- systemPrefersDark ------------------------------------------------
//
// Un único listener de matchMedia, registrado una sola vez a nivel de
// módulo (este bloque de nivel superior se ejecuta una vez por carga del
// módulo, nunca dentro de una función que pueda invocarse repetidas veces).
// Bajo `browser` para no tocar `window`/`matchMedia` en SSR o herramientas
// de build.
const darkMediaQuery = browser ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const systemPrefersDarkStore: Writable<boolean> = writable(darkMediaQuery?.matches ?? false);

if (darkMediaQuery) {
	darkMediaQuery.addEventListener('change', (event) => {
		systemPrefersDarkStore.set(event.matches);
	});
}

export const systemPrefersDark: Readable<boolean> = {
	subscribe: systemPrefersDarkStore.subscribe
};

// --- themeChoice --------------------------------------------------------

function isThemeFamily(value: unknown): value is ThemeFamily {
	return THEME_FAMILIES.some((family) => family.id === value);
}

function isSchemePreference(value: unknown): value is SchemePreference {
	return value === 'system' || value === 'dark' || value === 'light';
}

function loadStoredThemeChoice(): ThemeChoice {
	if (!browser) return DEFAULT_THEME_CHOICE;

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_THEME_CHOICE;

		const parsed = JSON.parse(raw) as Partial<Record<keyof ThemeChoice, unknown>> | null;
		if (
			parsed &&
			typeof parsed === 'object' &&
			isThemeFamily(parsed.family) &&
			isSchemePreference(parsed.scheme)
		) {
			return { family: parsed.family, scheme: parsed.scheme };
		}

		return DEFAULT_THEME_CHOICE;
	} catch {
		return DEFAULT_THEME_CHOICE;
	}
}

export const themeChoice: Writable<ThemeChoice> = writable(loadStoredThemeChoice());

// --- derivados ------------------------------------------------------------

// Esquema que pide el usuario (o el SO en modo Sistema), antes de ver si el
// tema elegido lo tiene.
export const requestedScheme: Readable<ColorScheme> = derived(
	[themeChoice, systemPrefersDark],
	([$themeChoice, $systemPrefersDark]) =>
		$themeChoice.scheme !== 'system'
			? $themeChoice.scheme
			: $systemPrefersDark
				? 'dark'
				: 'light'
);

// Esquema que se pinta: el pedido, salvo en los temas que solo son oscuros.
// Única fuente de la que se derivan tanto shellPalette como editorPalette,
// para que ambos cambien juntos ante un cambio de esquema del SO.
export const effectiveScheme: Readable<ColorScheme> = derived(
	[themeChoice, requestedScheme],
	([$themeChoice, $requestedScheme]) => resolveScheme($themeChoice.family, $requestedScheme)
);

export const shellPalette: Readable<ShellPalette> = derived(
	[themeChoice, effectiveScheme],
	([$themeChoice, $effectiveScheme]) => themeVariant($themeChoice.family, $effectiveScheme).shell
);

export const editorPalette: Readable<EditorPalette> = derived(
	[themeChoice, effectiveScheme],
	([$themeChoice, $effectiveScheme]) => themeVariant($themeChoice.family, $effectiveScheme).editor
);

// --- efecto secundario ------------------------------------------------

/**
 * Se suscribe (una vez, desde +layout.svelte) a themeChoice/effectiveScheme/
 * shellPalette combinados. En cada cambio: escribe las `--palette-*` sobre
 * documentElement, fija `documentElement.style.colorScheme`, y persiste
 * themeChoice en localStorage. Devuelve una función de cleanup.
 */
export function initThemeEffects(): () => void {
	if (!browser) return () => {};

	const combined = derived(
		[themeChoice, effectiveScheme, shellPalette, editorPalette],
		([$themeChoice, $effectiveScheme, $shellPalette, $editorPalette]) => ({
			choice: $themeChoice,
			scheme: $effectiveScheme,
			palette: $shellPalette,
			editor: $editorPalette
		})
	);

	const unsubscribe = combined.subscribe(({ choice, scheme, palette, editor }) => {
		const root = document.documentElement;

		for (const key of Object.keys(SHELL_PALETTE_CSS_VARS) as (keyof ShellPalette)[]) {
			root.style.setProperty(SHELL_PALETTE_CSS_VARS[key], palette[key]);
		}

		// Colores de sintaxis del editor, para resaltar fuera de CodeMirror
		// (p.ej. celdas JSON del grid) con los mismos tonos que el SQL.
		root.style.setProperty('--syntax-key', editor.function);
		root.style.setProperty('--syntax-string', editor.string);
		root.style.setProperty('--syntax-number', editor.number);
		root.style.setProperty('--syntax-constant', editor.constant);
		root.style.setProperty('--syntax-keyword', editor.keyword);
		root.style.setProperty('--syntax-comment', editor.comment);

		root.style.colorScheme = scheme;
		// Los pocos estilos que dependen del esquema y no se pueden expresar
		// con un token (degradados de identidad, alto contraste) leen este
		// atributo, no prefers-color-scheme: el usuario puede elegir claro con
		// el sistema en oscuro.
		root.dataset.scheme = scheme;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
		} catch {
			// localStorage no disponible (privado, cuota llena, etc.) — no
			// persistir no debe romper la app.
		}
	});

	return unsubscribe;
}
