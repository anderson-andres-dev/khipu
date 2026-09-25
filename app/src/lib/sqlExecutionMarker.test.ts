import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import {
  executionMarkerField,
  formatExecutionTime,
  markerFromResult,
  setExecutionMarker,
} from "$lib/sqlExecutionMarker";

function stateWithMarker(doc: string, from: number, to: number) {
  const state = EditorState.create({ doc, extensions: [executionMarkerField] });
  return state.update({ effects: setExecutionMarker.of({ from, to, status: "success", executionTimeMs: 411 }) })
    .state;
}

describe("executionMarkerField", () => {
  it("sigue a la sentencia cuando se escribe antes de ella", () => {
    const state = stateWithMarker("SELECT 1;", 0, 9);
    const next = state.update({ changes: { from: 0, insert: "\n\n" } }).state;
    expect(next.field(executionMarkerField)).toMatchObject({ from: 2, to: 11 });
  });

  it("no crece al escribir justo despues del final de la sentencia", () => {
    const state = stateWithMarker("SELECT 1;", 0, 9);
    const next = state.update({ changes: { from: 9, insert: " SELECT 2;" } }).state;
    expect(next.field(executionMarkerField)).toMatchObject({ from: 0, to: 9 });
  });

  it("desaparece si se borra la sentencia completa", () => {
    const state = stateWithMarker("SELECT 1;", 0, 9);
    const next = state.update({ changes: { from: 0, to: 9 } }).state;
    expect(next.field(executionMarkerField)).toBeNull();
  });
});

describe("markerFromResult", () => {
  it("toma el tiempo de un resultado correcto", () => {
    const result = { type: "command", affectedRows: 3, executionTimeMs: 12 } as const;
    expect(markerFromResult(0, 5, result)).toEqual({ from: 0, to: 5, status: "success", executionTimeMs: 12 });
  });

  it("marca el error con su mensaje y sin tiempo", () => {
    const result = { type: "error", message: "Table doesn't exist" } as const;
    expect(markerFromResult(0, 5, result)).toEqual({
      from: 0,
      to: 5,
      status: "error",
      message: "Table doesn't exist",
    });
  });
});

describe("formatExecutionTime", () => {
  it("usa ms por debajo de un segundo y s por encima", () => {
    expect(formatExecutionTime(411)).toBe("411 ms");
    expect(formatExecutionTime(1234)).toBe("1.23 s");
    expect(formatExecutionTime(12_345)).toBe("12.3 s");
  });
});
