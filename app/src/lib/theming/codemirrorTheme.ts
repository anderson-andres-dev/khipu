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
				backgroundColor: palette.background
			},
			'.cm-cursor, .cm-dropCursor': {
				borderLeftColor: palette.caret
			},
			'.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
				backgroundColor: palette.selection
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
