import { describe, expect, it } from "vitest";
import {
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  clampSidebarWidth,
  releaseSidebarDrag,
} from "$lib/stores/sidebarLayout";

describe("releaseSidebarDrag", () => {
  it("colapsa si se suelta por debajo del ancho minimo", () => {
    expect(releaseSidebarDrag(MIN_SIDEBAR_WIDTH - 1)).toEqual({ collapse: true });
    expect(releaseSidebarDrag(0)).toEqual({ collapse: true });
  });

  it("conserva el ancho si queda dentro del rango", () => {
    expect(releaseSidebarDrag(MIN_SIDEBAR_WIDTH)).toEqual({ collapse: false, width: MIN_SIDEBAR_WIDTH });
    expect(releaseSidebarDrag(300.4)).toEqual({ collapse: false, width: 300 });
  });

  it("acota el ancho al maximo", () => {
    expect(releaseSidebarDrag(MAX_SIDEBAR_WIDTH + 200)).toEqual({ collapse: false, width: MAX_SIDEBAR_WIDTH });
  });
});

describe("clampSidebarWidth", () => {
  it("nunca devuelve un ancho fuera del rango", () => {
    expect(clampSidebarWidth(10)).toBe(MIN_SIDEBAR_WIDTH);
    expect(clampSidebarWidth(10_000)).toBe(MAX_SIDEBAR_WIDTH);
  });
});
