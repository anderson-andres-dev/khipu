import { describe, expect, it } from "vitest";
import { palettes, type ColorScheme, type ThemeFamily } from "$lib/theming/palettes";
// ?raw de Vite: el archivo como texto, sin depender de node:fs.
import appHtml from "../../app.html?raw";
import tokensCss from "../styles/tokens.css?raw";

const FAMILIES: ThemeFamily[] = ["datagrip", "vscode"];
const SCHEMES: ColorScheme[] = ["dark", "light"];

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// --- Contraste WCAG ------------------------------------------------------

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

// Valores de las variantes oscuras antes de la reestructuracion de los
// temas claros. Las oscuras son la referencia visual de la app: ningun
// campo que ya existia puede cambiar sin que este test lo note.
const DARK_BEFORE = {
  "datagrip": {
    "shell": {
      "surface": "#191A1C",
      "surfaceElevated": "#26282C",
      "border": "#33353B",
      "controlBorder": "#8B8E94",
      "textPrimary": "#D1D3D9",
      "textSecondary": "#9FA2A8",
      "textOnAccent": "#FFFFFF",
      "accent": "#3871E1",
      "danger": "#F57E84",
      "controlDisabled": "#4C4F56",
      "focusRing": "#3871E1",
      "shadow": "0 8px 30px rgba(0,0,0,0.45)",
      "topbarBackground": "rgba(25,26,28,0.72)"
    },
    "editor": {
      "background": "#191A1C",
      "foreground": "#BCBEC4",
      "caret": "#CED0D6",
      "selection": "#2A4371",
      "lineNumber": "#73767C",
      "activeLineNumber": "#B5B7BD",
      "comment": "#9FA2A8",
      "keyword": "#CF8E6D",
      "string": "#6AAB73",
      "number": "#2AACB8",
      "function": "#56A8F5",
      "constant": "#C77DBB",
      "error": "#FA6675"
    }
  },
  "vscode": {
    "shell": {
      "surface": "#191A1B",
      "surfaceElevated": "#242526",
      "border": "#2A2B2C",
      "controlBorder": "#333536",
      "textPrimary": "#BFBFBF",
      "textSecondary": "#8C8C8C",
      "textOnAccent": "#FFFFFF",
      "accent": "#297AA0",
      "danger": "#F48771",
      "controlDisabled": "#555555",
      "focusRing": "#3994BC",
      "shadow": "0 8px 30px rgba(0,0,0,0.5)",
      "topbarBackground": "rgba(25,26,27,0.72)"
    },
    "editor": {
      "background": "#121314",
      "foreground": "#BBBEBF",
      "caret": "#BBBEBF",
      "selection": "#276782",
      "lineNumber": "#858889",
      "activeLineNumber": "#BBBEBF",
      "comment": "#8B949E",
      "keyword": "#FF7B72",
      "string": "#A5D6FF",
      "number": "#B5CEA8",
      "function": "#D2A8FF",
      "constant": "#79C0FF",
      "error": "#F48771"
    }
  }
} as const;

describe("variantes oscuras", () => {
  it.each(FAMILIES)("%s conserva todos sus valores previos", (family) => {
    const before = DARK_BEFORE[family];
    const now = palettes[family].dark;
    for (const [key, value] of Object.entries(before.shell)) {
      expect(now.shell[key as keyof typeof now.shell], `shell.${key}`).toBe(value);
    }
    for (const [key, value] of Object.entries(before.editor)) {
      expect(now.editor[key as keyof typeof now.editor], `editor.${key}`).toBe(value);
    }
  });
});

describe("copias de la paleta del shell", () => {
  it("app.html pinta los mismos valores que palettes.ts", () => {
    const html = appHtml;
    const start = html.indexOf("var SHELL_PALETTES = ");
    const end = html.indexOf("};", start);
    const literal = html.slice(start + "var SHELL_PALETTES = ".length, end + 1);
    // Es un literal de objeto JS escrito a mano (no JSON): se evalua tal cual.
    const copied = new Function(`return (${literal});`)();

    for (const family of FAMILIES) {
      for (const scheme of SCHEMES) {
        expect(copied[family][scheme], `${family}.${scheme}`).toEqual(palettes[family][scheme].shell);
      }
    }
  });

  it("app.html conoce todas las variables CSS", () => {
    const html = appHtml;
    for (const key of Object.keys(palettes.datagrip.dark.shell)) {
      expect(html).toContain(`${key}: '--palette-${kebab(key)}'`);
    }
  });

  it.each([
    ["dark", ":root {"],
    ["light", "@media (prefers-color-scheme: light) {"],
  ] as const)("tokens.css tiene DataGrip %s como default", (scheme, marker) => {
    const css = tokensCss;
    const block = css.slice(css.indexOf(marker), css.indexOf("}", css.indexOf(marker)));
    for (const [key, value] of Object.entries(palettes.datagrip[scheme].shell)) {
      expect(block, key).toContain(`--palette-${kebab(key)}: ${value};`);
    }
  });
});

describe("contraste de las variantes claras", () => {
  it.each(FAMILIES)("%s: texto del shell legible", (family) => {
    const shell = palettes[family].light.shell;
    for (const background of [shell.surface, shell.surfaceElevated]) {
      expect(contrast(shell.textPrimary, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(shell.textSecondary, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(FAMILIES)("%s: estados distinguibles sobre elevated", (family) => {
    const shell = palettes[family].light.shell;
    for (const color of [shell.danger, shell.success, shell.warning, shell.accent]) {
      expect(contrast(color, shell.surfaceElevated), color).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(FAMILIES)("%s: sintaxis del editor legible", (family) => {
    const editor = palettes[family].light.editor;
    for (const color of [editor.foreground, editor.keyword, editor.string, editor.number, editor.function, editor.constant]) {
      expect(contrast(color, editor.background), color).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(editor.comment, editor.background)).toBeGreaterThanOrEqual(3);
  });
});
