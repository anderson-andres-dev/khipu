export interface ShellPalette {
	surface: string;
	surfaceElevated: string;
	border: string;
	controlBorder: string;
	textPrimary: string;
	textSecondary: string;
	textOnAccent: string;
	accent: string;
	danger: string;
	controlDisabled: string;
	focusRing: string;
	shadow: string;
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
}

export interface ThemeVariant {
	shell: ShellPalette;
	editor: EditorPalette;
}

export type ThemeFamily = 'datagrip' | 'vscode';
export type ColorScheme = 'dark' | 'light';

export const palettes: Record<ThemeFamily, Record<ColorScheme, ThemeVariant>> = {
	datagrip: {
		dark: {
			shell: {
				surface: '#191A1C',
				surfaceElevated: '#26282C',
				border: '#33353B',
				controlBorder: '#8B8E94',
				textPrimary: '#D1D3D9',
				textSecondary: '#9FA2A8',
				textOnAccent: '#FFFFFF',
				accent: '#3871E1',
				danger: '#F57E84',
				controlDisabled: '#4C4F56',
				focusRing: '#3871E1',
				shadow: '0 8px 30px rgba(0,0,0,0.45)',
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
				error: '#FA6675'
			}
		},
		light: {
			shell: {
				surface: '#E9EAEE',
				surfaceElevated: '#FFFFFF',
				border: '#DDDFE4',
				controlBorder: '#5F6269',
				textPrimary: '#000000',
				textSecondary: '#4C4F56',
				textOnAccent: '#FFFFFF',
				accent: '#3871E1',
				danger: '#C54E58',
				controlDisabled: '#9FA2A8',
				focusRing: '#3871E1',
				shadow: '0 8px 30px rgba(0,0,0,0.12)',
				topbarBackground: 'rgba(233,234,238,0.72)'
			},
			editor: {
				background: '#FFFFFF',
				foreground: '#080808',
				caret: '#080808',
				selection: '#D0DFFE',
				lineNumber: '#8B8E94',
				activeLineNumber: '#4C4F56',
				comment: '#5F6269',
				keyword: '#0033B3',
				string: '#067D17',
				number: '#1750EB',
				function: '#00627A',
				constant: '#871094',
				error: '#C54E58'
			}
		}
	},
	vscode: {
		dark: {
			shell: {
				surface: '#191A1B',
				surfaceElevated: '#242526',
				border: '#2A2B2C',
				controlBorder: '#333536',
				textPrimary: '#BFBFBF',
				textSecondary: '#8C8C8C',
				textOnAccent: '#FFFFFF',
				accent: '#297AA0',
				danger: '#F48771',
				controlDisabled: '#555555',
				focusRing: '#3994BC',
				shadow: '0 8px 30px rgba(0,0,0,0.5)',
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
				error: '#F48771'
			}
		},
		light: {
			shell: {
				surface: '#FAFAFD',
				surfaceElevated: '#FFFFFF',
				border: '#E4E5E6',
				controlBorder: '#D8D8D8',
				textPrimary: '#202020',
				textSecondary: '#606060',
				textOnAccent: '#FFFFFF',
				accent: '#0069CC',
				danger: '#AD0707',
				controlDisabled: '#BBBBBB',
				focusRing: '#0069CC',
				shadow: '0 8px 24px rgba(0,0,0,0.15)',
				topbarBackground: 'rgba(250,250,253,0.72)'
			},
			editor: {
				background: '#FFFFFF',
				foreground: '#202020',
				caret: '#202020',
				selection: '#0069CC40',
				lineNumber: '#606060',
				activeLineNumber: '#202020',
				comment: '#6E7781',
				keyword: '#CF222E',
				string: '#0A3069',
				number: '#098658',
				function: '#8250DF',
				constant: '#0550AE',
				error: '#AD0707'
			}
		}
	}
};
