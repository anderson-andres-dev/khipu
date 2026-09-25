import { describe, expect, it } from "vitest";
import { CompletionContext } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import { MySQL } from "@codemirror/lang-sql";
import { buildCompletionSource, buildSqlSchema, extractDefaultTable } from "./sqlSchema";
import type { CatalogTable } from "./types";

const USERS: CatalogTable = {
  schema: "public",
  name: "users",
  columns: [
    { name: "id", dataType: "integer", nullable: false, isPrimaryKey: true },
    { name: "name", dataType: "text", nullable: false, isPrimaryKey: false },
  ],
  foreignKeys: [],
};

const ORDERS: CatalogTable = {
  schema: "public",
  name: "orders",
  columns: [
    { name: "id", dataType: "integer", nullable: false, isPrimaryKey: true },
    { name: "user_id", dataType: "integer", nullable: false, isPrimaryKey: false },
  ],
  foreignKeys: [{ column: "user_id", referencedTable: "users", referencedColumn: "id" }],
};

const CATALOG = [USERS, ORDERS];

// El marcador "|" indica el cursor; source() no necesita un EditorView real,
// un EditorState alcanza para levantar un CompletionContext.
async function complete(withCursor: string) {
  const pos = withCursor.indexOf("|");
  if (pos === -1) throw new Error("test input must contain a | cursor marker");
  const doc = withCursor.slice(0, pos) + withCursor.slice(pos + 1);
  // schemaCompletionSource lee el arbol de sintaxis (syntaxTree) para saber
  // si el cursor esta sobre un Identifier/Keyword; sin el lenguaje SQL
  // adjunto al estado, ese arbol esta vacio y la libreria devuelve null
  // siempre. MySQL.language es el mismo que usa sql({dialect}) en el editor
  // real (ver SqlEditor.svelte).
  const state = EditorState.create({ doc, selection: { anchor: pos }, extensions: [MySQL.language] });
  const context = new CompletionContext(state, pos, false);

  const { schema, defaultSchema, fkIndex } = buildSqlSchema(CATALOG);
  // SqlEditor.svelte calcula esto en su updateListener a partir del texto
  // vivo; se replica aca para probar buildCompletionSource tal como lo usa
  // la app de verdad, no una version mas permisiva.
  const defaultTable = extractDefaultTable(doc, pos);
  const source = buildCompletionSource({ dialect: MySQL, driver: "mysql", schema, defaultSchema, defaultTable, fkIndex });
  return source(context);
}

function labels(result: Awaited<ReturnType<typeof complete>>): string[] {
  return (result?.options ?? []).map((option) => option.label);
}

describe("buildCompletionSource - los tres casos reportados, de punta a punta", () => {
  it("select * fro| no ofrece tablas sueltas", async () => {
    const result = await complete("select * fro|");
    expect(labels(result)).not.toContain("users");
    expect(labels(result)).not.toContain("orders");
    expect(labels(result).map((l) => l.toLowerCase())).toContain("from");
  });

  it("se| (inicio de sentencia) no ofrece tablas sueltas", async () => {
    const result = await complete("se|");
    expect(labels(result)).not.toContain("users");
    expect(labels(result)).toContain("SELECT");
    expect(result?.options.find((option) => option.label === "SELECT")?.detail).toBe("Consultar filas");
  });

  it("FROM users wh| excluye WHEN/WHILE y prioriza WHERE", async () => {
    const result = await complete("SELECT * FROM users wh|");
    const opts = result?.options ?? [];
    const byLabel = new Map(opts.map((o) => [o.label.toLowerCase(), o]));
    expect(byLabel.has("when")).toBe(false);
    expect(byLabel.has("while")).toBe(false);
    expect(byLabel.has("whenever")).toBe(false);
    expect(byLabel.has("where")).toBe(true);
  });
});

describe("buildCompletionSource - no romper lo que ya funcionaba", () => {
  it("FROM us| sigue ofreciendo tablas (relation-target)", async () => {
    const result = await complete("SELECT * FROM us|");
    expect(labels(result)).toContain("users");
  });

  it("alias.columna sigue resolviendo via la libreria sin filtrar", async () => {
    const result = await complete("SELECT * FROM users u WHERE u.na|");
    expect(labels(result)).toContain("name");
  });

  it("FROM users JOIN o| sugiere la tabla relacionada por FK con el ON resuelto", async () => {
    // Con la palabra vacia (recien tipeado "JOIN " sin nada mas) la fuente de
    // JOIN no dispara salvo invocacion explicita, igual que antes de este
    // cambio - se prueba con un caracter tipeado, que es el uso real.
    const result = await complete("SELECT * FROM users JOIN o|");
    const orders = result?.options.find((o) => o.label === "orders");
    expect(orders).toBeDefined();
    expect(orders?.displayLabel).toContain("ON users.id = orders.user_id");
  });

  it("WHERE ofrece columnas reales, no las suprime la expresion", async () => {
    const result = await complete("SELECT * FROM users WHERE na|");
    expect(labels(result)).toContain("name");
  });
});

describe("buildCompletionSource - columnas sin calificar antes del FROM y con JOIN", () => {
  it("SELECT na| FROM users sugiere columnas de la tabla aunque el FROM este despues del cursor", async () => {
    const result = await complete("SELECT na| FROM users");
    expect(labels(result)).toContain("name");
  });

  it("SELECT co| FROM users JOIN orders sugiere columnas de ambas tablas sin calificar", async () => {
    // Palabra no vacia ("co"): igual que en el test de JOIN de arriba, la
    // palabra vacia solo dispara con invocacion explicita.
    const result = await complete("SELECT co| FROM users JOIN orders ON users.id = orders.user_id");
    expect(labels(result)).toContain("name");
    expect(labels(result)).toContain("user_id");
  });
});
