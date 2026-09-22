export type CompletionKind = "Keyword" | "Table" | "Column" | "Function";

export interface CompletionItem {
  label: string;
  kind: CompletionKind;
}
