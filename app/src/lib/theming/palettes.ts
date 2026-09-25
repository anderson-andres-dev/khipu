export interface ShellPalette {
	surface: string;
	surfaceElevated: string;
	// Hover de elementos que estan sobre `surface` (filas del arbol, botones
	// de icono, pestañas). No es lo mismo que surfaceElevated: en los temas
	// claros elevated es blanco, que sobre un surface casi blanco no se ve.
	surfaceHover: string;
	// Fondo del contenido (grid de resultados, DDL): en los temas claros va
	// en blanco como el editor, en los oscuros coincide con surface.
	surfaceContent: string;
	border: string;
	// Lineas entre celdas del grid. Separado de border para poder hacerlas
	// mas tenues que las divisiones de paneles.
	gridLine: string;
	controlBorder: string;
	textPrimary: string;
	textSecondary: string;
	textOnAccent: string;
	accent: string;
	accentHover: string;
	danger: string;
	success: string;
	warning: string;
	// Llave de clave primaria (arbol, header del grid, autocompletado).
	keyPrimary: string;
	controlDisabled: string;
	focusRing: string;
	shadow: string;
	// Fondo detras de los modales.
	scrim: string;
	scrollbarThumb: string;
	scrollbarThumbHover: string;
	topbarBackground: string;
}

export interface EditorPalette {
	background: string;
	foreground: string;
	caret: string;
	selection: string;
	lineNumber: string;
	activeLineNumber: string;
	comment: string;
	keyword: string;
	string: string;
	number: string;
	function: string;
	constant: string;
	error: string;
	// Recuadro de la sentencia activa y marca de ejecucion correcta. Antes
	// reusaban `string`; en los temas oscuros siguen teniendo ese valor.
	activeStatement: string;
	success: string;
}

export interface ThemeVariant {
	shell: ShellPalette;
	editor: EditorPalette;
}

export type ThemeFamily = 'datagrip' | 'vscode';
export type ColorScheme = 'dark' | 'light';

// Las variantes oscuras son la referencia visual de la app: sus valores no
// se tocan (palettes.test.ts lo verifica). Las claras siguen a los temas
// reales: JetBrains Int UI Light y VS Code Light Modern.
//
// Cualquier cambio en `shell` hay que replicarlo en app.html (bootstrap
// antes del primer paint) y en tokens.css (fallback); palettes.test.ts
// falla si quedan desincronizados.
export const palettes: Record<ThemeFamily, Record<ColorScheme, ThemeVariant>> = {
	datagrip: {
		dark: {
			shell: {
				surface: '#191A1C',
				surfaceElevated: '#26282C',
				surfaceHover: '#26282C',
				surfaceContent: '#191A1C',
				border: '#33353B',
				gridLine: '#33353B',
				controlBorder: '#8B8E94',
				textPrimary: '#D1D3D9',
				textSecondary: '#9FA2A8',
				textOnAccent: '#FFFFFF',
				accent: '#3871E1',
				accentHover: '#5485E5',
				danger: '#F57E84',
				success: '#4CAF50',
				warning: '#E8B339',
				keyPrimary: '#E8B339',
				controlDisabled: '#4C4F56',
				focusRing: '#3871E1',
				shadow: '0 8px 30px rgba(0,0,0,0.45)',
				scrim: 'rgba(0,0,0,0.5)',
				scrollbarThumb: 'rgba(139,142,148,0.65)',
				scrollbarThumbHover: '#9FA2A8',
				topbarBackground: 'rgba(25,26,28,0.72)'
			},
			editor: {
				background: '#191A1C',
				foreground: '#BCBEC4',
				caret: '#CED0D6',
				selection: '#2A4371',
				lineNumber: '#73767C',
				activeLineNumber: '#B5B7BD',
				comment: '#9FA2A8',
				keyword: '#CF8E6D',
				string: '#6AAB73',
				number: '#2AACB8',
				function: '#56A8F5',
				constant: '#C77DBB',
				error: '#FA6675',
				activeStatement: '#6AAB73',
				success: '#6AAB73'
			}
		},
		light: {
			shell: {
				surface: '#F7F8FA',
				surfaceElevated: '#FFFFFF',
				surfaceHover: '#EBECF0',
				surfaceContent: '#FFFFFF',
				border: '#EBECF0',
				gridLine: '#EBECF0',
				controlBorder: '#C9CCD6',
				textPrimary: '#1E1F22',
				textSecondary: '#6C707E',
				textOnAccent: '#FFFFFF',
				accent: '#3574F0',
				accentHover: '#2B63D6',
				danger: '#DB3B4B',
				success: '#208A3C',
				warning: '#C27D04',
				keyPrimary: '#B98A10',
				controlDisabled: '#A8ADBD',
				focusRing: '#3574F0',
				shadow: '0 8px 28px rgba(0,0,0,0.10)',
				scrim: 'rgba(0,0,0,0.28)',
				scrollbarThumb: '#C9CCD6',
				scrollbarThumbHover: '#A8ADBD',
				topbarBackground: 'rgba(247,248,250,0.8)'
			},
			editor: {
				background: '#FFFFFF',
				foreground: '#080808',
				caret: '#000000',
				selection: '#A6D2FF',
				lineNumber: '#AEB3C2',
				activeLineNumber: '#767A8A',
				comment: '#8C8C8C',
				keyword: '#0033B3',
				string: '#067D17',
				number: '#1750EB',
				function: '#00627A',
				constant: '#871094',
				error: '#DB3B4B',
				activeStatement: '#9CCBA5',
				success: '#208A3C'
			}
		}
	},
	vscode: {
		dark: {
			shell: {
				surface: '#191A1B',
				surfaceElevated: '#242526',
				surfaceHover: '#242526',
				surfaceContent: '#191A1B',
				border: '#2A2B2C',
				gridLine: '#2A2B2C',
				controlBorder: '#333536',
				textPrimary: '#BFBFBF',
				textSecondary: '#8C8C8C',
				textOnAccent: '#FFFFFF',
				accent: '#297AA0',
				accentHover: '#478DAD',
				danger: '#F48771',
				success: '#4CAF50',
				warning: '#E8B339',
				keyPrimary: '#E8B339',
				controlDisabled: '#555555',
				focusRing: '#3994BC',
				shadow: '0 8px 30px rgba(0,0,0,0.5)',
				scrim: 'rgba(0,0,0,0.5)',
				scrollbarThumb: 'rgba(51,53,54,0.65)',
				scrollbarThumbHover: '#8C8C8C',
				topbarBackground: 'rgba(25,26,27,0.72)'
			},
			editor: {
				background: '#121314',
				foreground: '#BBBEBF',
				caret: '#BBBEBF',
				selection: '#276782',
				lineNumber: '#858889',
				activeLineNumber: '#BBBEBF',
				comment: '#8B949E',
				keyword: '#FF7B72',
				string: '#A5D6FF',
				number: '#B5CEA8',
				function: '#D2A8FF',
				constant: '#79C0FF',
				error: '#F48771',
				activeStatement: '#A5D6FF',
				success: '#A5D6FF'
			}
		},
		light: {
			shell: {
				surface: '#F8F8F8',
				surfaceElevated: '#FFFFFF',
				surfaceHover: '#EDEDED',
				surfaceContent: '#FFFFFF',
				border: '#E5E5E5',
				gridLine: '#EBEBEB',
				controlBorder: '#CECECE',
				textPrimary: '#3B3B3B',
				textSecondary: '#6E6E6E',
				textOnAccent: '#FFFFFF',
				accent: '#005FB8',
				accentHover: '#0258A8',
				danger: '#C4314B',
				success: '#388A34',
				warning: '#BF8803',
				keyPrimary: '#BF8803',
				controlDisabled: '#BDBDBD',
				focusRing: '#005FB8',
				shadow: '0 8px 24px rgba(0,0,0,0.10)',
				scrim: 'rgba(0,0,0,0.28)',
				scrollbarThumb: '#CCCCCC',
				scrollbarThumbHover: '#AFAFAF',
				topbarBackground: 'rgba(248,248,248,0.8)'
			},
			editor: {
				background: '#FFFFFF',
				foreground: '#3B3B3B',
				caret: '#000000',
				selection: '#ADD6FF',
				lineNumber: '#6E7681',
				activeLineNumber: '#171184',
				comment: '#008000',
				keyword: '#0000FF',
				string: '#A31515',
				number: '#098658',
				function: '#795E26',
				constant: '#0070C1',
				error: '#E51400',
				activeStatement: '#9DC2EA',
				success: '#388A34'
			}
		}
	}
};
