import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { EditorPalette, ColorScheme } from './palettes';

/**
 * Builds a CodeMirror theme extension (shell styling + syntax highlighting)
 * from a curated EditorPalette.
 *
 * Note: `palette.function` and `palette.error` are intentionally NOT consumed
 * here — `@codemirror/lang-sql`'s grammar does not emit a distinguishable
 * "function name" tag (identifiers/builtins fall into generic tags) nor an
 * "invalid" tag (there is no linter). Those two palette fields are reserved
 * for a future function-highlighting extension or linter (see spec).
 */
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
				boxShadow: `inset 1px 0 ${palette.string}, inset -1px 0 ${palette.string}`
			},
			'.cm-activeStatement.cm-activeStatementStart': {
				boxShadow: `inset 1px 0 ${palette.string}, inset -1px 0 ${palette.string}, inset 0 1px ${palette.string}`
			},
			'.cm-activeStatement.cm-activeStatementEnd': {
				boxShadow: `inset 1px 0 ${palette.string}, inset -1px 0 ${palette.string}, inset 0 -1px ${palette.string}`
			},
			'.cm-activeStatement.cm-activeStatementStart.cm-activeStatementEnd': {
				boxShadow: `inset 1px 0 ${palette.string}, inset -1px 0 ${palette.string}, inset 0 1px ${palette.string}, inset 0 -1px ${palette.string}`
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

	return [themeExtension, syntaxHighlighting(highlightStyle)];
}
