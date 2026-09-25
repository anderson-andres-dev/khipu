import { describe, expect, it } from "vitest";
import { __test } from "./editorSearchPanel";

describe("preservar mayusculas al reemplazar", () => {
  it("copia el formato de lo encontrado", () => {
    expect(__test.preserveCase("insert", "SELECT")).toBe("INSERT");
    expect(__test.preserveCase("insert", "Select")).toBe("Insert");
    expect(__test.preserveCase("INSERT", "select")).toBe("insert");
    // Formato mixto: tal cual.
    expect(__test.preserveCase("nuevoNombre", "viejoNombre")).toBe("nuevoNombre");
    // Sin letras: tal cual.
    expect(__test.preserveCase("x", "123")).toBe("x");
  });
});
