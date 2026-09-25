import { invoke } from "@tauri-apps/api/core";
import type { DestructiveStatement, ExecuteQueryResponse } from "$lib/types";

export interface PageRequest {
  offset: number;
  pageSize: number;
}

// Unico punto de invocacion del comando "execute_query": si el transporte de
// Tauri falla (no un error SQL, que ya llega dentro de ExecuteQueryResponse),
// lo normaliza a un resultado de tipo "error" para que el llamador no tenga
// que distinguir dos formas distintas de fallo.
export async function executeQuery(
  sql: string,
  confirmedStatement: DestructiveStatement | null,
  page: PageRequest | null = null,
): Promise<ExecuteQueryResponse> {
  try {
    return await invoke<ExecuteQueryResponse>("execute_query", {
      sql,
      confirmedStatement,
      page,
    });
  } catch (e) {
    return {
      type: "completed",
      result: { type: "error", message: String(e) },
    };
  }
}

// Total de filas de la consulta (SELECT COUNT(*) FROM (...)). Lanza un
// Error con el mensaje del servidor si falla.
export async function countQueryRows(sql: string): Promise<number> {
  return await invoke<number>("count_query_rows", { sql });
}
