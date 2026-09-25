import { describe, expect, it } from "vitest";
import { LOCALES, matchSystemLocale } from "./locales";
import { messages } from "./messages";
import { translator } from "./index";

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

describe("messages", () => {
  for (const [namespace, table] of Object.entries(messages)) {
    const byLocale = table as Record<string, Record<string, string>>;
    const sourceKeys = Object.keys(byLocale.es).sort();

    for (const target of LOCALES) {
      it(`${namespace}: ${target} tiene las mismas claves y parámetros que es`, () => {
        expect(Object.keys(byLocale[target]).sort()).toEqual(sourceKeys);
        for (const key of sourceKeys) {
          expect(placeholders(byLocale[target][key]), `${namespace}.${key}`).toEqual(placeholders(byLocale.es[key]));
          expect(byLocale[target][key].trim(), `${namespace}.${key}`).not.toBe("");
        }
      });
    }
  }
});

describe("translator", () => {
  it("traduce según el idioma", () => {
    expect(translator("en")("common.cancel")).toBe("Cancel");
    expect(translator("es")("common.cancel")).toBe("Cancelar");
  });
});

describe("matchSystemLocale", () => {
  it("elige por código completo, luego por idioma base y si no inglés", () => {
    expect(matchSystemLocale(["pt-BR"])).toBe("pt-BR");
    expect(matchSystemLocale(["pt-PT"])).toBe("pt-BR");
    expect(matchSystemLocale(["es-EC", "en-US"])).toBe("es");
    expect(matchSystemLocale(["de-AT"])).toBe("de");
    expect(matchSystemLocale(["ja-JP", "fr-CA"])).toBe("fr");
    expect(matchSystemLocale(["ja-JP"])).toBe("en");
  });
});

describe("consoleDisplayTitle", () => {
  it("traduce solo el nombre por defecto consola_N", async () => {
    const { consoleDisplayTitle } = await import("$lib/stores/queryConsoles");
    expect(consoleDisplayTitle("consola_3", translator("en"))).toBe("console_3");
    expect(consoleDisplayTitle("consola_3", translator("de"))).toBe("konsole_3");
    expect(consoleDisplayTitle("consola_3", translator("es"))).toBe("consola_3");
    expect(consoleDisplayTitle("reportes", translator("en"))).toBe("reportes");
  });
});
