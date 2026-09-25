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
	// Fondo de los botones destructivos (texto blanco encima) y tinte de las
	// filas por eliminar: `danger` es para texto y en los temas oscuros es
	// demasiado claro para llevar texto blanco.
	dangerSolid: string;
	dangerSolidHover: string;
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
	// Colores opcionales para un resaltado más rico (tipos, funciones
	// integradas, operadores). Sin ellos, los tipos usan `keyword` y el resto
	// `foreground`, como siempre en DataGrip y VS Code.
	type?: string;
	builtin?: string;
	operator?: string;
	// Paneles, tooltips y búsqueda de CodeMirror con los tokens del shell. Los
	// temas claros lo reciben siempre; los oscuros originales no lo necesitan
	// (ver codemirrorTheme.ts).
	tokenChrome?: boolean;
}

export interface ThemeVariant {
	shell: ShellPalette;
	editor: EditorPalette;
}

export type ThemeFamily = 'rowly' | 'datagrip' | 'vscode' | 'onedark' | 'dracula' | 'nord' | 'gruvbox' | 'solarized';
export type ColorScheme = 'dark' | 'light';

// One Dark, Dracula y Nord son temas oscuros por diseño: no tienen variante
// clara y, elegidos, la app queda en oscuro aunque el modo sea Claro.
export interface ThemeVariants {
	dark: ThemeVariant;
	light?: ThemeVariant;
}

export const THEME_FAMILIES: { id: ThemeFamily; label: string }[] = [
	{ id: 'rowly', label: 'Rowly' },
	{ id: 'datagrip', label: 'DataGrip' },
	{ id: 'vscode', label: 'VS Code' },
	{ id: 'onedark', label: 'One Dark' },
	{ id: 'dracula', label: 'Dracula' },
	{ id: 'nord', label: 'Nord' },
	{ id: 'gruvbox', label: 'Gruvbox' },
	{ id: 'solarized', label: 'Solarized' }
];

/** Variante que se pinta: la pedida si el tema la tiene, si no la oscura. */
export function resolveScheme(family: ThemeFamily, scheme: ColorScheme): ColorScheme {
	return scheme === 'light' && palettes[family].light ? 'light' : 'dark';
}

export function themeVariant(family: ThemeFamily, scheme: ColorScheme): ThemeVariant {
	const variants = palettes[family];
	return (resolveScheme(family, scheme) === 'light' ? variants.light : undefined) ?? variants.dark;
}

// Las variantes oscuras de DataGrip y VS Code son la referencia visual de la
// app: sus valores no se tocan (palettes.test.ts lo verifica). Las claras
// siguen a los temas reales: JetBrains Int UI Light y VS Code Light Modern.
//
// One Dark, Dracula, Nord, Gruvbox y Solarized usan los colores oficiales de
// cada tema. La sintaxis es la oficial tal cual; en el shell solo se aclaran
// el texto secundario y los estados de error cuando el color oficial no
// alcanza a leerse sobre los paneles.
//
// Cualquier cambio en `shell` hay que replicarlo en app.html (bootstrap
// antes del primer paint) y en tokens.css (fallback); palettes.test.ts
// falla si quedan desincronizados.
export const palettes: Record<ThemeFamily, ThemeVariants> = {
	// Rowly: el tema propio de Rowly DB. Superficies en la misma familia teal
	// de la marca (#082126 → #F5FAFA) y acento turquesa/menta; la sintaxis usa
	// complementarios cálidos (arena, coral) y fríos (cielo, lila) para que el
	// teal mande sin que todo el código sea del mismo color.
	rowly: {
		dark: {
			shell: {
				surface: '#0C262C',
				surfaceElevated: '#133239',
				surfaceHover: '#122F35',
				surfaceContent: '#091D22',
				border: '#1A3C43',
				gridLine: '#143238',
				controlBorder: '#2E5A62',
				textPrimary: '#DCEAEC',
				textSecondary: '#8FA6AC',
				textOnAccent: '#04191D',
				accent: '#2EB8AA',
				accentHover: '#49C5B6',
				danger: '#F28B82',
				dangerSolid: '#D6454D',
				dangerSolidHover: '#E05A61',
				success: '#5CCB8A',
				warning: '#E9B45A',
				keyPrimary: '#E9B45A',
				controlDisabled: '#2A474D',
				focusRing: '#49C5B6',
				shadow: '0 10px 32px rgba(2,12,15,0.55)',
				scrim: 'rgba(3,14,17,0.6)',
				scrollbarThumb: 'rgba(73,197,182,0.22)',
				scrollbarThumbHover: 'rgba(73,197,182,0.4)',
				topbarBackground: 'rgba(12,38,44,0.78)'
			},
			editor: {
				background: '#091D22',
				foreground: '#CFDFE2',
				caret: '#49C5B6',
				selection: '#16434A',
				lineNumber: '#46646B',
				activeLineNumber: '#A9C2C7',
				comment: '#628087',
				keyword: '#49C5B6',
				string: '#E6B87A',
				number: '#F29E7C',
				function: '#7CC4F2',
				constant: '#D59BF0',
				error: '#F28B82',
				activeStatement: '#1F5D63',
				success: '#49C5B6',
				type: '#9FB8F7',
				builtin: '#7CC4F2',
				operator: '#8FB7BC',
				tokenChrome: true
			}
		},
		light: {
			shell: {
				surface: '#EEF4F5',
				surfaceElevated: '#FFFFFF',
				surfaceHover: '#E3EDEF',
				surfaceContent: '#FCFEFE',
				border: '#D9E5E7',
				gridLine: '#E7EFF0',
				controlBorder: '#B7C9CD',
				textPrimary: '#0B2D33',
				textSecondary: '#56696F',
				textOnAccent: '#FFFFFF',
				accent: '#0B8281',
				accentHover: '#0A7070',
				danger: '#C23B45',
				dangerSolid: '#C23B45',
				dangerSolidHover: '#D0505A',
				success: '#1F8A5B',
				warning: '#A87310',
				keyPrimary: '#B07A12',
				controlDisabled: '#B7C9CD',
				focusRing: '#0E9594',
				shadow: '0 10px 30px rgba(11,45,51,0.10)',
				scrim: 'rgba(8,33,38,0.28)',
				scrollbarThumb: '#C9D8DB',
				scrollbarThumbHover: '#A9BEC3',
				topbarBackground: 'rgba(238,244,245,0.82)'
			},
			editor: {
				background: '#FCFEFE',
				foreground: '#1E3A40',
				caret: '#0E9594',
				selection: '#C4E7E3',
				lineNumber: '#A7B8BC',
				activeLineNumber: '#0B2D33',
				comment: '#71868C',
				keyword: '#0B7F7E',
				string: '#96570F',
				number: '#BC4328',
				function: '#1D6CAD',
				constant: '#8A3DB3',
				error: '#C23B45',
				activeStatement: '#8FD0C8',
				success: '#0E9594',
				type: '#4A5CBE',
				builtin: '#1D6CAD',
				operator: '#0B7F7E',
				tokenChrome: true
			}
		}
	},
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
				dangerSolid: '#E5484D',
				dangerSolidHover: '#EC5D5E',
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
				dangerSolid: '#E5484D',
				dangerSolidHover: '#EC5D5E',
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
				dangerSolid: '#E5484D',
				dangerSolidHover: '#EC5D5E',
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
				dangerSolid: '#E5484D',
				dangerSolidHover: '#EC5D5E',
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
	},
	// One Dark (Atom): paneles #21252B, editor #282C34.
	onedark: {
		dark: {
			shell: {
				surface: '#21252B',
				surfaceElevated: '#2C313A',
				surfaceHover: '#2C313A',
				surfaceContent: '#282C34',
				border: '#181A1F',
				gridLine: '#333842',
				controlBorder: '#4B5263',
				textPrimary: '#ABB2BF',
				textSecondary: '#979EAB',
				textOnAccent: '#FFFFFF',
				accent: '#4D78CC',
				accentHover: '#6089D6',
				danger: '#E06C75',
				dangerSolid: '#BE5046',
				dangerSolidHover: '#CC5E54',
				success: '#98C379',
				warning: '#E5C07B',
				keyPrimary: '#E5C07B',
				controlDisabled: '#4B5263',
				focusRing: '#528BFF',
				shadow: '0 8px 30px rgba(0,0,0,0.5)',
				scrim: 'rgba(0,0,0,0.5)',
				scrollbarThumb: 'rgba(78,86,102,0.6)',
				scrollbarThumbHover: '#5A6375',
				topbarBackground: 'rgba(33,37,43,0.72)'
			},
			editor: {
				background: '#282C34',
				foreground: '#ABB2BF',
				caret: '#528BFF',
				selection: '#3E4451',
				lineNumber: '#636D83',
				activeLineNumber: '#ABB2BF',
				comment: '#7F848E',
				keyword: '#C678DD',
				string: '#98C379',
				number: '#D19A66',
				function: '#61AFEF',
				constant: '#D19A66',
				error: '#E06C75',
				activeStatement: '#5C6370',
				success: '#98C379',
				type: '#E5C07B',
				builtin: '#61AFEF',
				operator: '#56B6C2',
				tokenChrome: true
			}
		}
	},
	// Dracula (spec oficial): fondo #282A36, paneles #21222C, acento morado.
	dracula: {
		dark: {
			shell: {
				surface: '#21222C',
				surfaceElevated: '#343746',
				surfaceHover: '#343746',
				surfaceContent: '#282A36',
				border: '#191A21',
				gridLine: '#343746',
				controlBorder: '#6272A4',
				textPrimary: '#F8F8F2',
				textSecondary: '#A7ABBE',
				textOnAccent: '#282A36',
				accent: '#BD93F9',
				accentHover: '#CAA8FA',
				danger: '#FF5555',
				dangerSolid: '#E04848',
				dangerSolidHover: '#F05A5A',
				success: '#50FA7B',
				warning: '#F1FA8C',
				keyPrimary: '#F1FA8C',
				controlDisabled: '#44475A',
				focusRing: '#BD93F9',
				shadow: '0 8px 30px rgba(0,0,0,0.55)',
				scrim: 'rgba(0,0,0,0.55)',
				scrollbarThumb: 'rgba(98,114,164,0.45)',
				scrollbarThumbHover: '#6272A4',
				topbarBackground: 'rgba(33,34,44,0.72)'
			},
			editor: {
				background: '#282A36',
				foreground: '#F8F8F2',
				caret: '#F8F8F2',
				selection: '#44475A',
				lineNumber: '#6272A4',
				activeLineNumber: '#F8F8F2',
				comment: '#6272A4',
				keyword: '#FF79C6',
				string: '#F1FA8C',
				number: '#BD93F9',
				function: '#50FA7B',
				constant: '#BD93F9',
				error: '#FF5555',
				activeStatement: '#6272A4',
				success: '#50FA7B',
				type: '#8BE9FD',
				builtin: '#50FA7B',
				operator: '#FF79C6',
				tokenChrome: true
			}
		}
	},
	// Nord: Polar Night de fondo, Snow Storm de texto, Frost de acento.
	nord: {
		dark: {
			shell: {
				surface: '#2E3440',
				surfaceElevated: '#3B4252',
				surfaceHover: '#3B4252',
				surfaceContent: '#2E3440',
				border: '#3B4252',
				gridLine: '#3B4252',
				controlBorder: '#4C566A',
				textPrimary: '#D8DEE9',
				textSecondary: '#AAB2C0',
				textOnAccent: '#2E3440',
				accent: '#88C0D0',
				accentHover: '#9FCFDC',
				danger: '#D98089',
				dangerSolid: '#BF616A',
				dangerSolidHover: '#C9737B',
				success: '#A3BE8C',
				warning: '#EBCB8B',
				keyPrimary: '#EBCB8B',
				controlDisabled: '#4C566A',
				focusRing: '#88C0D0',
				shadow: '0 8px 30px rgba(0,0,0,0.4)',
				scrim: 'rgba(20,24,31,0.55)',
				scrollbarThumb: 'rgba(76,86,106,0.75)',
				scrollbarThumbHover: '#616E88',
				topbarBackground: 'rgba(46,52,64,0.72)'
			},
			editor: {
				background: '#2E3440',
				foreground: '#D8DEE9',
				caret: '#D8DEE9',
				selection: '#434C5E',
				lineNumber: '#616E88',
				activeLineNumber: '#D8DEE9',
				comment: '#616E88',
				keyword: '#81A1C1',
				string: '#A3BE8C',
				number: '#B48EAD',
				function: '#88C0D0',
				constant: '#81A1C1',
				error: '#BF616A',
				activeStatement: '#4C566A',
				success: '#A3BE8C',
				type: '#8FBCBB',
				builtin: '#88C0D0',
				operator: '#81A1C1',
				tokenChrome: true
			}
		}
	},
	// Gruvbox (morhetz): bg0 #282828 / #FBF1C7, acento naranja.
	gruvbox: {
		dark: {
			shell: {
				surface: '#282828',
				surfaceElevated: '#32302F',
				surfaceHover: '#3C3836',
				surfaceContent: '#282828',
				border: '#3C3836',
				gridLine: '#3C3836',
				controlBorder: '#665C54',
				textPrimary: '#EBDBB2',
				textSecondary: '#A89984',
				textOnAccent: '#282828',
				accent: '#FE8019',
				accentHover: '#FF9A45',
				danger: '#FB4934',
				dangerSolid: '#CC241D',
				dangerSolidHover: '#DD3A2C',
				success: '#B8BB26',
				warning: '#FABD2F',
				keyPrimary: '#FABD2F',
				controlDisabled: '#504945',
				focusRing: '#FE8019',
				shadow: '0 8px 30px rgba(0,0,0,0.5)',
				scrim: 'rgba(0,0,0,0.5)',
				scrollbarThumb: 'rgba(102,92,84,0.7)',
				scrollbarThumbHover: '#7C6F64',
				topbarBackground: 'rgba(40,40,40,0.72)'
			},
			editor: {
				background: '#282828',
				foreground: '#EBDBB2',
				caret: '#EBDBB2',
				selection: '#504945',
				lineNumber: '#7C6F64',
				activeLineNumber: '#FABD2F',
				comment: '#928374',
				keyword: '#FB4934',
				string: '#B8BB26',
				number: '#D3869B',
				function: '#8EC07C',
				constant: '#D3869B',
				error: '#FB4934',
				activeStatement: '#665C54',
				success: '#B8BB26',
				type: '#FABD2F',
				builtin: '#8EC07C',
				operator: '#FE8019',
				tokenChrome: true
			}
		},
		light: {
			shell: {
				surface: '#F2E5BC',
				surfaceElevated: '#F9F5D7',
				surfaceHover: '#EBDBB2',
				surfaceContent: '#FBF1C7',
				border: '#D5C4A1',
				gridLine: '#EBDBB2',
				controlBorder: '#BDAE93',
				textPrimary: '#3C3836',
				textSecondary: '#665C54',
				textOnAccent: '#FBF1C7',
				accent: '#AF3A03',
				accentHover: '#9A3302',
				danger: '#9D0006',
				dangerSolid: '#9D0006',
				dangerSolidHover: '#B3190F',
				success: '#79740E',
				warning: '#B57614',
				keyPrimary: '#B57614',
				controlDisabled: '#BDAE93',
				focusRing: '#AF3A03',
				shadow: '0 8px 28px rgba(60,56,54,0.14)',
				scrim: 'rgba(40,40,40,0.28)',
				scrollbarThumb: '#D5C4A1',
				scrollbarThumbHover: '#BDAE93',
				topbarBackground: 'rgba(242,229,188,0.8)'
			},
			editor: {
				background: '#FBF1C7',
				foreground: '#3C3836',
				caret: '#3C3836',
				selection: '#D5C4A1',
				lineNumber: '#A89984',
				activeLineNumber: '#B57614',
				comment: '#928374',
				keyword: '#9D0006',
				string: '#79740E',
				number: '#8F3F71',
				function: '#427B58',
				constant: '#8F3F71',
				error: '#9D0006',
				activeStatement: '#BDAE93',
				success: '#79740E',
				type: '#B57614',
				builtin: '#427B58',
				operator: '#AF3A03',
				tokenChrome: true
			}
		}
	},
	// Solarized (Ethan Schoonover): base03/base3 de fondo, mismos acentos en ambos modos.
	solarized: {
		dark: {
			shell: {
				surface: '#00212B',
				surfaceElevated: '#073642',
				surfaceHover: '#073642',
				surfaceContent: '#002B36',
				border: '#073642',
				gridLine: '#073642',
				controlBorder: '#586E75',
				textPrimary: '#93A1A1',
				textSecondary: '#839496',
				textOnAccent: '#FDF6E3',
				accent: '#268BD2',
				accentHover: '#3A98DA',
				danger: '#EC5E5B',
				dangerSolid: '#DC322F',
				dangerSolidHover: '#E4504C',
				success: '#859900',
				warning: '#B58900',
				keyPrimary: '#B58900',
				controlDisabled: '#586E75',
				focusRing: '#268BD2',
				shadow: '0 8px 30px rgba(0,0,0,0.5)',
				scrim: 'rgba(0,16,21,0.6)',
				scrollbarThumb: 'rgba(88,110,117,0.6)',
				scrollbarThumbHover: '#657B83',
				topbarBackground: 'rgba(0,33,43,0.72)'
			},
			editor: {
				background: '#002B36',
				foreground: '#839496',
				caret: '#93A1A1',
				selection: '#274642',
				lineNumber: '#586E75',
				activeLineNumber: '#93A1A1',
				comment: '#586E75',
				keyword: '#859900',
				string: '#2AA198',
				number: '#D33682',
				function: '#268BD2',
				constant: '#CB4B16',
				error: '#DC322F',
				activeStatement: '#586E75',
				success: '#859900',
				type: '#B58900',
				builtin: '#268BD2',
				operator: '#859900',
				tokenChrome: true
			}
		},
		light: {
			shell: {
				surface: '#EEE8D5',
				surfaceElevated: '#FDF6E3',
				surfaceHover: '#E4DDC8',
				surfaceContent: '#FDF6E3',
				border: '#DDD6C1',
				gridLine: '#EEE8D5',
				controlBorder: '#C9C1A8',
				textPrimary: '#073642',
				textSecondary: '#52676E',
				textOnAccent: '#FDF6E3',
				accent: '#268BD2',
				accentHover: '#1F7AB9',
				danger: '#DC322F',
				dangerSolid: '#DC322F',
				dangerSolidHover: '#C92A27',
				success: '#738A00',
				warning: '#A07800',
				keyPrimary: '#B58900',
				controlDisabled: '#93A1A1',
				focusRing: '#268BD2',
				shadow: '0 8px 28px rgba(0,43,54,0.12)',
				scrim: 'rgba(0,43,54,0.25)',
				scrollbarThumb: '#D6CFBA',
				scrollbarThumbHover: '#BCB39B',
				topbarBackground: 'rgba(238,232,213,0.8)'
			},
			editor: {
				background: '#FDF6E3',
				foreground: '#657B83',
				caret: '#586E75',
				selection: '#E6DDC4',
				lineNumber: '#93A1A1',
				activeLineNumber: '#586E75',
				comment: '#93A1A1',
				keyword: '#859900',
				string: '#2AA198',
				number: '#D33682',
				function: '#268BD2',
				constant: '#CB4B16',
				error: '#DC322F',
				activeStatement: '#93A1A1',
				success: '#859900',
				type: '#B58900',
				builtin: '#268BD2',
				operator: '#859900',
				tokenChrome: true
			}
		}
	}
};
