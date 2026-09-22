//! In-memory schema catalog that completion resolves against. Populated by a
//! khipu-driver-* plugin via `DbConnector::list_tables`, kept independent of any
//! single database's introspection format.

#[derive(Debug, Clone, Default)]
pub struct SchemaCatalog {
    pub tables: Vec<CatalogTable>,
}

#[derive(Debug, Clone)]
pub struct CatalogTable {
    pub schema: String,
    pub name: String,
    pub columns: Vec<String>,
}

impl SchemaCatalog {
    pub fn tables_matching(&self, prefix: &str) -> Vec<&CatalogTable> {
        self.tables
            .iter()
            .filter(|t| t.name.starts_with(prefix))
            .collect()
    }
}
