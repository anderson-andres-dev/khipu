use crate::catalog::SchemaCatalog;
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub enum CompletionKind {
    Keyword,
    Table,
    Column,
    Function,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct CompletionItem {
    pub label: String,
    pub kind: CompletionKind,
}

pub struct CompletionEngine {
    catalog: SchemaCatalog,
}

impl CompletionEngine {
    pub fn new(catalog: SchemaCatalog) -> Self {
        Self { catalog }
    }

    /// `sql` is the buffer up to the cursor. Context resolution (are we after FROM,
    /// inside a WHERE, past a dot on an alias...) lands here as the engine grows.
    pub fn complete(&self, sql: &str) -> Vec<CompletionItem> {
        let prefix = sql
            .rsplit(|c: char| !c.is_alphanumeric() && c != '_')
            .next()
            .unwrap_or("");

        self.catalog
            .tables_matching(prefix)
            .into_iter()
            .map(|t| CompletionItem {
                label: t.name.clone(),
                kind: CompletionKind::Table,
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::{CatalogColumn, CatalogTable};

    fn id_column() -> CatalogColumn {
        CatalogColumn {
            name: "id".to_string(),
            data_type: "integer".to_string(),
            nullable: false,
            is_primary_key: true,
        }
    }

    fn catalog() -> SchemaCatalog {
        SchemaCatalog {
            tables: vec![
                CatalogTable {
                    schema: "public".to_string(),
                    name: "users".to_string(),
                    columns: vec![id_column()],
                },
                CatalogTable {
                    schema: "public".to_string(),
                    name: "orders".to_string(),
                    columns: vec![id_column()],
                },
            ],
        }
    }

    #[test]
    fn complete_returns_matching_table_as_completion_item() {
        let engine = CompletionEngine::new(catalog());

        let items = engine.complete("SELECT * FROM us");

        assert_eq!(
            items,
            vec![CompletionItem {
                label: "users".to_string(),
                kind: CompletionKind::Table,
            }]
        );
    }

    #[test]
    fn complete_returns_empty_when_prefix_matches_nothing() {
        let engine = CompletionEngine::new(catalog());

        let items = engine.complete("SELECT * FROM zzz");

        assert!(items.is_empty());
    }

    #[test]
    fn completion_item_serializes_to_expected_json_shape() {
        let item = CompletionItem {
            label: "users".to_string(),
            kind: CompletionKind::Table,
        };

        let json = serde_json::to_value(&item).expect("CompletionItem should serialize");

        assert_eq!(
            json,
            serde_json::json!({
                "label": "users",
                "kind": "Table",
            })
        );
    }
}
