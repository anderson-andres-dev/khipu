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
