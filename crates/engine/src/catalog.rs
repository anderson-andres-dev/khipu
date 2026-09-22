//! In-memory schema catalog that completion resolves against. Populated by a
//! khipu-driver-* crate via `DbConnector::list_tables`, kept independent of any
//! single database's introspection format.

#[derive(Debug, Clone, Default)]
pub struct SchemaCatalog {
    pub tables: Vec<CatalogTable>,
}

#[derive(Debug, Clone)]
pub struct CatalogTable {
    pub schema: String,
    pub name: String,
    pub columns: Vec<CatalogColumn>,
}

/// A single column's shape as reported by the driver's introspection, kept as
/// the engine's own type so `khipu-engine` never has to depend on
/// `khipu-driver-core` just to hold this data.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CatalogColumn {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub is_primary_key: bool,
}

impl SchemaCatalog {
    pub fn tables_matching(&self, prefix: &str) -> Vec<&CatalogTable> {
        self.tables
            .iter()
            .filter(|t| t.name.starts_with(prefix))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn column(name: &str) -> CatalogColumn {
        CatalogColumn {
            name: name.to_string(),
            data_type: "text".to_string(),
            nullable: true,
            is_primary_key: false,
        }
    }

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
                    columns: vec![id_column(), column("email")],
                },
                CatalogTable {
                    schema: "public".to_string(),
                    name: "user_roles".to_string(),
                    columns: vec![id_column(), column("user_id"), column("role")],
                },
                CatalogTable {
                    schema: "public".to_string(),
                    name: "orders".to_string(),
                    columns: vec![id_column(), column("user_id"), column("total")],
                },
            ],
        }
    }

    #[test]
    fn tables_matching_filters_by_name_prefix() {
        let catalog = catalog();

        let matches = catalog.tables_matching("user");

        let names: Vec<&str> = matches.iter().map(|t| t.name.as_str()).collect();
        assert_eq!(names, vec!["users", "user_roles"]);
    }

    #[test]
    fn tables_matching_returns_empty_when_no_prefix_matches() {
        let catalog = catalog();

        let matches = catalog.tables_matching("nope");

        assert!(matches.is_empty());
    }

    #[test]
    fn tables_matching_preserves_column_metadata() {
        let catalog = catalog();

        let matches = catalog.tables_matching("orders");
        let orders = matches.first().expect("orders table should match");

        assert_eq!(
            orders.columns,
            vec![id_column(), column("user_id"), column("total")]
        );
        assert!(orders.columns[0].is_primary_key);
        assert!(!orders.columns[0].nullable);
    }
}
