import { invoke } from "@tauri-apps/api/core";
import type { DestructiveStatement, ExecuteQueryResponse } from "$lib/types";

// Unico punto de invocacion del comando "execute_query": si el transporte de
// Tauri falla (no un error SQL, que ya llega dentro de ExecuteQueryResponse),
// lo normaliza a un resultado de tipo "error" para que el llamador no tenga
// que distinguir dos formas distintas de fallo.
export async function executeQuery(
  sql: string,
  confirmedStatement: DestructiveStatement | null,
): Promise<ExecuteQueryResponse> {
  try {
    return await invoke<ExecuteQueryResponse>("execute_query", {
      sql,
      confirmedStatement,
    });
  } catch (e) {
    return {
      type: "completed",
      result: { type: "error", message: String(e) },
    };
  }
}
