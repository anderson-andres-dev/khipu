export interface CatalogColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

export interface ForeignKey {
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface CatalogTable {
  schema: string;
  name: string;
  columns: CatalogColumn[];
  foreignKeys: ForeignKey[];
}

export interface QueryColumn {
  name: string;
  type: string;
  nullable?: boolean;
}

// `null` es un NULL real; toda otra celda (incluyendo los strings literales
// "NULL", "" y "0") llega como string, para no perder precision en
// DECIMAL/enteros grandes ni confundir un NULL real con su representacion
// textual.
export type QueryValue = string | null;
export type QueryRow = QueryValue[];

export type QueryExecutionResult =
  | {
      type: "resultSet";
      columns: QueryColumn[];
      rows: QueryRow[];
      rowCount: number;
      executionTimeMs: number;
      truncated: boolean;
    }
  | {
      type: "command";
      affectedRows: number;
      executionTimeMs: number;
    }
  | {
      type: "error";
      message: string;
      code?: string;
      position?: number;
    };

export type DestructiveStatement =
  | "deleteWithoutWhere"
  | "updateWithoutWhere"
  | "truncate"
  | "dropTable"
  | "dropSchema"
  | "dropDatabase"
  | "dropColumn";

export type ExecuteQueryResponse =
  | { type: "confirmationRequired"; statement: DestructiveStatement }
  | { type: "completed"; result: QueryExecutionResult };
