import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";

// El store real gatea localStorage detras de `browser` (ver
// $app/environment); en el resto de la suite (entorno "node", sin DOM) ese
// stub vale `false` para que los otros modulos tomen su rama sin storage.
// Aqui se necesita lo contrario para poder verificar que executionByConsole
// nunca se serializa, asi que este archivo pisa el mock solo para si mismo.
vi.mock("$app/environment", () => ({ browser: true }));

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

// El store es un singleton a nivel de modulo (creado al importar), asi que
// cada test necesita su propia instancia aislada: resetear el registro de
// modulos y re-importar con un localStorage en memoria nuevo.
async function freshQueryConsoles() {
  vi.resetModules();
  vi.stubGlobal("localStorage", createMemoryStorage());
  return await import("./queryConsoles");
}

describe("queryConsoles: estado de ejecucion por consola", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("requireQueryConfirmation crea el pending de la consola correcta y no toca otras", async () => {
    const mod = await freshQueryConsoles();
    const idA = mod.createQueryConsole("profile-a");
    const idB = mod.createQueryConsole("profile-a");

    mod.requireQueryConfirmation(idA, { sql: "DELETE FROM users", statement: "deleteWithoutWhere" });

    const state = get(mod.queryConsoles);
    expect(mod.executionForConsole(state, idA).pendingConfirmation).toEqual({
      sql: "DELETE FROM users",
      statement: "deleteWithoutWhere",
    });
    expect(mod.executionForConsole(state, idB).pendingConfirmation).toBeNull();
  });

  it("cancelQueryConfirmation elimina el pending sin crear un resultado de error", async () => {
    const mod = await freshQueryConsoles();
    const id = mod.createQueryConsole("profile-a");
    mod.requireQueryConfirmation(id, { sql: "TRUNCATE users", statement: "truncate" });

    mod.cancelQueryConfirmation(id);

    const execution = mod.executionForConsole(get(mod.queryConsoles), id);
    expect(execution.pendingConfirmation).toBeNull();
    expect(execution.result).toBeNull();
  });

  it("takeQueryConfirmation devuelve el pending una sola vez y despues null", async () => {
    const mod = await freshQueryConsoles();
    const id = mod.createQueryConsole("profile-a");
    const pending = { sql: "DROP TABLE users", statement: "dropTable" as const };
    mod.requireQueryConfirmation(id, pending);

    expect(mod.takeQueryConfirmation(id)).toEqual(pending);
    expect(mod.takeQueryConfirmation(id)).toBeNull();
    expect(mod.executionForConsole(get(mod.queryConsoles), id).pendingConfirmation).toBeNull();
  });

  it("editar el SQL de la consola limpia su pending pero conserva el resultado anterior", async () => {
    const mod = await freshQueryConsoles();
    const id = mod.createQueryConsole("profile-a");
    mod.finishQueryExecution(id, { type: "command", affectedRows: 1, executionTimeMs: 5 });
    mod.requireQueryConfirmation(id, { sql: "UPDATE users SET active = false", statement: "updateWithoutWhere" });

    mod.updateQueryConsoleSql(id, "UPDATE users SET active = false WHERE id = 1");

    const execution = mod.executionForConsole(get(mod.queryConsoles), id);
    expect(execution.pendingConfirmation).toBeNull();
    expect(execution.result).toEqual({ type: "command", affectedRows: 1, executionTimeMs: 5 });
  });

  it("cerrar una consola elimina su entrada de executionByConsole", async () => {
    const mod = await freshQueryConsoles();
    const idA = mod.createQueryConsole("profile-a");
    mod.createQueryConsole("profile-a");
    mod.requireQueryConfirmation(idA, { sql: "DELETE FROM users", statement: "deleteWithoutWhere" });

    mod.closeQueryConsole("profile-a", idA);

    expect(get(mod.queryConsoles).executionByConsole[idA]).toBeUndefined();
  });

  it("executionByConsole nunca se escribe en localStorage", async () => {
    const mod = await freshQueryConsoles();
    const id = mod.createQueryConsole("profile-a");
    mod.requireQueryConfirmation(id, { sql: "DELETE FROM users", statement: "deleteWithoutWhere" });
    mod.finishQueryExecution(id, { type: "error", message: "boom" });

    const raw = localStorage.getItem("khipu:query-consoles:v1");
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string);
    expect(persisted).not.toHaveProperty("executionByConsole");
    expect(Object.keys(persisted).sort()).toEqual(["activeByProfile", "consoles", "nextOrdinal"]);
  });

  it("beginQueryExecution no inicia una segunda ejecucion mientras la consola ya esta ocupada", async () => {
    const mod = await freshQueryConsoles();
    const id = mod.createQueryConsole("profile-a");

    expect(mod.beginQueryExecution(id)).toBe(true);
    expect(mod.beginQueryExecution(id)).toBe(false);

    mod.finishQueryExecution(id, { type: "command", affectedRows: 0, executionTimeMs: 1 });
    expect(mod.beginQueryExecution(id)).toBe(true);

    mod.requireQueryConfirmation(id, { sql: "TRUNCATE users", statement: "truncate" });
    expect(mod.beginQueryExecution(id)).toBe(false);
  });

  it("finishQueryExecution reemplaza el resultado y limpia isExecuting/pendingConfirmation", async () => {
    const mod = await freshQueryConsoles();
    const id = mod.createQueryConsole("profile-a");
    mod.beginQueryExecution(id);

    mod.finishQueryExecution(id, { type: "command", affectedRows: 2, executionTimeMs: 9 });

    const execution = mod.executionForConsole(get(mod.queryConsoles), id);
    expect(execution.isExecuting).toBe(false);
    expect(execution.pendingConfirmation).toBeNull();
    expect(execution.result).toEqual({ type: "command", affectedRows: 2, executionTimeMs: 9 });
  });
});
