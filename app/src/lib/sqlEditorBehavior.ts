import { syntaxTree } from "@codemirror/language";
import type { EditorState, Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";

export interface UppercaseKeywordEdit {
  from: number;
  to: number;
  insert: string;
  cursor: number;
}

// Se ejecuta justo cuando el usuario escribe el separador que termina una
// palabra. El parser SQL decide si lo anterior es realmente Keyword, por lo
// que identificadores, comentarios y strings quedan intactos.
export function uppercaseKeywordEdit(
  state: EditorState,
  from: number,
  to: number,
  text: string,
): UppercaseKeywordEdit | null {
  if (from !== to || text.length !== 1 || /[A-Za-z0-9_$]/.test(text) || from === 0) return null;

  const before = state.sliceDoc(0, from);
  const match = before.match(/[A-Za-z_][A-Za-z0-9_$]*$/);
  if (!match) return null;

  const word = match[0];
  const wordFrom = from - word.length;
  const node = syntaxTree(state).resolveInner(from - 1, -1);
  if (node.name !== "Keyword" || node.from !== wordFrom || node.to !== from) return null;

  const upper = word.toUpperCase();
  if (upper === word) return null;
  return { from: wordFrom, to: from, insert: upper + text, cursor: from + text.length };
}

export const autoUppercaseSqlKeywords: Extension = EditorView.inputHandler.of(
  (view, from, to, text) => {
    const edit = uppercaseKeywordEdit(view.state, from, to, text);
    if (!edit) return false;

    view.dispatch({
      changes: { from: edit.from, to: edit.to, insert: edit.insert },
      selection: { anchor: edit.cursor },
      userEvent: "input.type",
    });
    return true;
  },
);

function findStatement(state: EditorState) {
  const head = state.selection.main.head;
  for (const bias of [-1, 1] as const) {
    let node = syntaxTree(state).resolveInner(head, bias);
    while (node.parent && node.name !== "Statement") node = node.parent;
    if (node.name === "Statement") return node;
  }
  return null;
}

function statementDecorations(view: EditorView): DecorationSet {
  const statement = findStatement(view.state);
  if (!statement || statement.from === statement.to) return Decoration.none;

  const firstLine = view.state.doc.lineAt(statement.from);
  const lastLine = view.state.doc.lineAt(Math.max(statement.from, statement.to - 1));
  const decorations = [];
  let statementColumns = 1;

  for (let lineNumber = firstLine.number; lineNumber <= lastLine.number; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    const statementEnd = Math.min(line.to, statement.to);
    const textToStatementEnd = view.state.sliceDoc(line.from, statementEnd).trimEnd();
    let columns = 0;
    for (const char of textToStatementEnd) {
      columns = char === "\t" ? columns + (4 - (columns % 4)) : columns + 1;
    }
    statementColumns = Math.max(statementColumns, columns);
  }

  for (let lineNumber = firstLine.number; lineNumber <= lastLine.number; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    const classes = ["cm-activeStatement"];
    if (lineNumber === firstLine.number) classes.push("cm-activeStatementStart");
    if (lineNumber === lastLine.number) classes.push("cm-activeStatementEnd");
    decorations.push(
      Decoration.line({
        class: classes.join(" "),
        attributes: { style: `--cm-active-statement-width: ${statementColumns}ch` },
      }).range(line.from),
    );
  }

  return Decoration.set(decorations, true);
}

export const activeStatementHighlight: Extension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = statementDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      ) {
        this.decorations = statementDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
