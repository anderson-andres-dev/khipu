import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { EditorPalette, ColorScheme } from './palettes';

/**
 * Builds a CodeMirror theme extension (shell styling + syntax highlighting)
 * from a curated EditorPalette.
 *
 * Note: `palette.function` is intentionally NOT consumed here —
 * `@codemirror/lang-sql`'s grammar does not emit a distinguishable
 * "function name" tag (identifiers/builtins fall into generic tags); it is
 * reserved for a future function-highlighting extension (see spec).
 * `palette.error` is only used by the execution status marker (see
 * sqlExecutionMarker.ts), not for syntax highlighting — there is no linter.
 */
// Solo en los temas claros: CodeMirror trae defaults pensados para un
// editor generico (banda azul en el margen de la linea activa, borde del
// margen, contorno punteado al enfocar, coincidencias en lima, panel de
// busqueda gris con botones con degradado, tooltips grises) que sobre la UI
// clara de Khipu se ven improvisados. Se resuelven con los tokens del shell
// (variables CSS) para que sigan al tema. Los temas oscuros no reciben nada
// de esto a proposito: ya se ven como se quiere.
const LIGHT_OVERRIDES: Parameters<typeof EditorView.theme>[0] = {
	'.cm-gutters': {
		borderRight: 'none'
	},
	'.cm-activeLineGutter': {
		backgroundColor: 'transparent'
	},
	'&.cm-focused': {
		outline: 'none'
	},
	'.cm-selectionMatch': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)'
	},
	'&.cm-focused .cm-matchingBracket, .cm-matchingBracket': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
		outline: 'none'
	},
	'&.cm-focused .cm-nonmatchingBracket, .cm-nonmatchingBracket': {
		backgroundColor: 'color-mix(in srgb, var(--danger) 16%, transparent)'
	},
	'.cm-searchMatch': {
		backgroundColor: 'color-mix(in srgb, var(--warning) 26%, transparent)',
		outline: '1px solid color-mix(in srgb, var(--warning) 45%, transparent)'
	},
	'.cm-searchMatch.cm-searchMatch-selected': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 24%, transparent)',
		outline: '1px solid color-mix(in srgb, var(--accent) 50%, transparent)'
	},
	'.cm-panels': {
		backgroundColor: 'var(--surface)',
		color: 'var(--text-primary)'
	},
	'.cm-panels.cm-panels-top': {
		borderBottom: '1px solid var(--border)'
	},
	'.cm-panels.cm-panels-bottom': {
		borderTop: '1px solid var(--border)'
	},
	'.cm-textfield': {
		border: '1px solid var(--control-border)',
		borderRadius: '4px',
		backgroundColor: 'var(--surface-elevated)',
		color: 'var(--text-primary)'
	},
	'.cm-textfield:focus': {
		outline: '1px solid var(--focus-ring)',
		borderColor: 'var(--focus-ring)'
	},
	'.cm-button': {
		border: '1px solid var(--control-border)',
		borderRadius: '4px',
		backgroundImage: 'none',
		backgroundColor: 'var(--surface-elevated)',
		color: 'var(--text-primary)'
	},
	'.cm-button:hover': {
		backgroundColor: 'var(--surface-hover)'
	},
	'.cm-button:active': {
		backgroundImage: 'none',
		backgroundColor: 'var(--surface-hover)'
	},
	'.cm-panel.cm-search [name=close]': {
		color: 'var(--text-secondary)'
	},
	'.cm-foldPlaceholder': {
		border: '1px solid var(--border)',
		backgroundColor: 'var(--surface-hover)',
		color: 'var(--text-secondary)'
	},
	'.cm-tooltip': {
		border: '1px solid var(--border)',
		backgroundColor: 'var(--surface-elevated)',
		color: 'var(--text-primary)'
	},
	'.cm-tooltip .cm-completionInfo': {
		border: '1px solid var(--border)',
		backgroundColor: 'var(--surface-elevated)'
	}
};

export function buildCmTheme(palette: EditorPalette, scheme: ColorScheme): Extension {
	const themeExtension = EditorView.theme(
		{
			'&': {
				backgroundColor: palette.background,
				color: palette.foreground
			},
			'.cm-content': {
				caretColor: palette.caret
			},
			'.cm-gutters': {
				backgroundColor: palette.background,
				color: palette.lineNumber
			},
			'.cm-activeLineGutter': {
				color: palette.activeLineNumber
			},
			'.cm-activeLine': {
				// drawSelection pinta por debajo del contenido. Un fondo incluso
				// identico al del editor tapa la seleccion en la linea que contiene
				// el cursor (la cm-activeLine); transparente conserva la capa azul.
				backgroundColor: 'transparent !important'
			},
			'.cm-activeStatement': {
				width: 'calc(var(--cm-active-statement-width) + 0.5ch)',
				boxShadow: `inset 1px 0 ${palette.activeStatement}, inset -1px 0 ${palette.activeStatement}`
			},
			'.cm-activeStatement.cm-activeStatementStart': {
				boxShadow: `inset 1px 0 ${palette.activeStatement}, inset -1px 0 ${palette.activeStatement}, inset 0 1px ${palette.activeStatement}`
			},
			'.cm-activeStatement.cm-activeStatementEnd': {
				boxShadow: `inset 1px 0 ${palette.activeStatement}, inset -1px 0 ${palette.activeStatement}, inset 0 -1px ${palette.activeStatement}`
			},
			'.cm-activeStatement.cm-activeStatementStart.cm-activeStatementEnd': {
				boxShadow: `inset 1px 0 ${palette.activeStatement}, inset -1px 0 ${palette.activeStatement}, inset 0 1px ${palette.activeStatement}, inset 0 -1px ${palette.activeStatement}`
			},
			// Marcador de la ultima ejecucion (sqlExecutionMarker.ts): la forma
			// del icono sale de sqlEditorIcons.css, el color de la paleta.
			'.cm-executionStatus-success': {
				backgroundColor: palette.success
			},
			'.cm-executionStatus-error': {
				backgroundColor: palette.error
			},
			'.cm-executionStatus-running': {
				backgroundColor: palette.lineNumber
			},
			'.cm-executionTime': {
				color: palette.comment,
				marginLeft: '2ch',
				fontSize: '0.85em',
				userSelect: 'none'
			},
			'.cm-cursor, .cm-dropCursor': {
				borderLeftColor: palette.caret
			},
			// CodeMirror define el color de seleccion por defecto (@codemirror/view)
			// con selectores muy especificos, entre ellos
			// "&dark.cm-focused > .cm-scroller > .cm-selectionLayer
			// .cm-selectionBackground" - misma cantidad de clases que un intento
			// de pisarlo con "&.cm-focused > .cm-scroller > .cm-selectionLayer
			// .cm-selectionBackground" propio, asi que el empate de especificidad
			// puede perderse igual segun el orden real de insercion de las hojas
			// de estilo. Con !important no hay ambiguedad posible.
			'.cm-selectionBackground': {
				backgroundColor: palette.selection + ' !important'
			},
			'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
				backgroundColor: palette.selection + ' !important'
			}
		},
		{ dark: scheme === 'dark' }
	);

	const highlightStyle = HighlightStyle.define([
		{ tag: tags.keyword, color: palette.keyword },
		{ tag: tags.typeName, color: palette.keyword },
		{ tag: tags.string, color: palette.string },
		{ tag: tags.number, color: palette.number },
		{ tag: [tags.lineComment, tags.blockComment], color: palette.comment, fontStyle: 'italic' },
		{ tag: [tags.bool, tags.null], color: palette.constant }
	]);

	const lightOverrides = scheme === 'light' ? [EditorView.theme(LIGHT_OVERRIDES)] : [];

	return [themeExtension, ...lightOverrides, syntaxHighlighting(highlightStyle)];
}
