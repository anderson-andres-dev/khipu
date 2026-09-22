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
