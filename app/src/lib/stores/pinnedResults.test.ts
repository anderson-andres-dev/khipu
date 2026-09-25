import { describe, expect, it } from "vitest";
import { get } from "svelte/store";
import {
  addPinnedTab,
  consoleOfKey,
  pinnedResults,
  removePinnedTab,
  resultKey,
  setResultPinned,
  unpinnedTabs,
} from "./pinnedResults";

describe("pinnedResults", () => {
  it("cada pestaña fijada tiene su propia clave, y la clave vuelve a su consola", () => {
    const id = addPinnedTab("c1");
    const key = resultKey("c1", id);
    expect(key).not.toBe("c1");
    expect(consoleOfKey(key)).toBe("c1");
    expect(consoleOfKey("c1")).toBe("c1");
  });

  it("desfijar no la quita: solo la marca para la proxima ejecucion", () => {
    const a = addPinnedTab("c2");
    const b = addPinnedTab("c2");
    setResultPinned("c2", a, false);
    expect(get(pinnedResults).c2.map((item) => item.id)).toEqual([a, b]);
    expect(unpinnedTabs(get(pinnedResults), "c2").map((item) => item.id)).toEqual([a]);
    setResultPinned("c2", a, true);
    expect(unpinnedTabs(get(pinnedResults), "c2")).toEqual([]);
    removePinnedTab("c2", b);
    expect(get(pinnedResults).c2.map((item) => item.id)).toEqual([a]);
  });
});
