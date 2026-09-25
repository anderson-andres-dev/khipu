import { RangeSet, StateEffect, StateField, type EditorState, type Extension } from "@codemirror/state";
import { Decoration, EditorView, GutterMarker, WidgetType, gutter, type DecorationSet } from "@codemirror/view";
import { translate, type MessageKey } from "$lib/i18n";
import type { QueryExecutionResult } from "$lib/types";

// Estado de la ultima sentencia ejecutada desde el editor, al estilo
// DataGrip: un icono en el margen de su primera linea (ejecutando / ok /
// error) y el tiempo en ms al final de la sentencia. El rango se mapea con
// cada edicion, asi que el marcador sigue a la sentencia si se escribe
// antes o dentro de ella.
//
// "pending" es el tramo en que el guard de sentencias destructivas espera
// confirmacion: se conserva el rango (si se confirma, el resultado vuelve a
// esta misma sentencia) pero no se pinta nada, porque todavia no corre.
export type ExecutionMarkerStatus = "pending" | "running" | "success" | "error";

export interface ExecutionMarker {
  from: number;
  to: number;
  status: ExecutionMarkerStatus;
  executionTimeMs?: number;
  message?: string;
}

export const setExecutionMarker = StateEffect.define<ExecutionMarker | null>();

export const executionMarkerField = StateField.define<ExecutionMarker | null>({
  create: () => null,
  update(marker, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setExecutionMarker)) return effect.value;
    }
    if (!marker || !transaction.docChanged) return marker;

    const from = transaction.changes.mapPos(marker.from, 1);
    const to = transaction.changes.mapPos(marker.to, -1);
    // La sentencia se borro por completo: no queda a que atar el marcador.
    return to > from ? { ...marker, from, to } : null;
  },
});

export function markerFromResult(from: number, to: number, result: QueryExecutionResult): ExecutionMarker {
  if (result.type === "error") return { from, to, status: "error", message: result.message };
  return { from, to, status: "success", executionTimeMs: result.executionTimeMs };
}

export function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
}

// El texto se traduce al armar el marcador y forma parte de eq(): con
// cualquier actualizacion de la vista despues de cambiar el idioma, el
// gutter ve un marcador distinto y lo vuelve a pintar.
class StatusGutterMarker extends GutterMarker {
  readonly label: string;

  constructor(
    readonly status: ExecutionMarkerStatus,
    readonly message: string | undefined,
  ) {
    super();
    this.label = translate(STATUS_LABEL[status]);
  }

  eq(other: StatusGutterMarker) {
    return other.status === this.status && other.message === this.message && other.label === this.label;
  }

  toDOM() {
    const element = document.createElement("span");
    element.className = `cm-executionStatus cm-executionStatus-${this.status}`;
    element.setAttribute("aria-label", this.label);
    element.title = this.message ?? this.label;
    return element;
  }
}

const STATUS_LABEL: Record<ExecutionMarkerStatus, MessageKey> = {
  pending: "editor.marker.pending",
  running: "editor.marker.running",
  success: "editor.marker.success",
  error: "editor.marker.error",
};

class ExecutionTimeWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  eq(other: ExecutionTimeWidget) {
    return other.text === this.text;
  }

  toDOM() {
    const element = document.createElement("span");
    element.className = "cm-executionTime";
    element.textContent = this.text;
    return element;
  }

  ignoreEvent() {
    return false;
  }
}

function executionTimeDecorations(state: EditorState): DecorationSet {
  const marker = state.field(executionMarkerField);
  if (!marker || marker.executionTimeMs === undefined || marker.to > state.doc.length) return Decoration.none;
  const widget = new ExecutionTimeWidget(formatExecutionTime(marker.executionTimeMs));
  return Decoration.set([Decoration.widget({ widget, side: 1 }).range(marker.to)]);
}

export const executionMarker: Extension = [
  executionMarkerField,
  EditorView.decorations.compute([executionMarkerField], executionTimeDecorations),
  gutter({
    class: "cm-executionGutter",
    markers(view) {
      const marker = view.state.field(executionMarkerField);
      if (!marker || marker.status === "pending" || marker.from > view.state.doc.length) return RangeSet.empty;
      const line = view.state.doc.lineAt(marker.from);
      return RangeSet.of([new StatusGutterMarker(marker.status, marker.message).range(line.from)]);
    },
    initialSpacer: () => new StatusGutterMarker("success", undefined),
  }),
];
