//! Builds `SchemaObjects` from the flat rows catalog queries return, so each
//! driver only has to translate its engine's rows and never re-implements
//! the grouping (a multi-column key arrives as one row per column, a
//! Postgres trigger's events arrive packed in one row, a MySQL trigger's as
//! one row per event...). Pure and database-free on purpose: this is the
//! part of introspection that can be unit tested without a server.

use crate::{
    CheckInfo, ColumnInfo, ForeignKeyInfo, IndexInfo, KeyInfo, RelationKind, TableInfo, TriggerInfo,
};
use std::collections::HashMap;

/// The relations of one schema, indexed by name, that catalog rows get
/// attached to. Rows naming a relation that isn't here (created between two
/// catalog queries, or filtered out like a Postgres partition) are dropped
/// silently instead of failing the whole schema.
pub struct TableSet {
    schema: String,
    tables: Vec<TableInfo>,
    index: HashMap<String, usize>,
}

/// One column of a primary key or unique constraint.
pub struct KeyColumnRow {
    pub table: String,
    pub name: String,
    pub primary: bool,
    pub column: String,
}

/// One column (or expression) of an index.
pub struct IndexColumnRow {
    pub table: String,
    pub name: String,
    pub unique: bool,
    pub primary: bool,
    pub method: Option<String>,
    pub column: String,
}

/// One event of a trigger (MySQL reports exactly one per trigger; Postgres
/// rows are expanded into one per event by the driver before this).
pub struct TriggerEventRow {
    pub table: String,
    pub name: String,
    pub timing: String,
    pub event: String,
}

impl TableSet {
    pub fn new(schema: &str) -> Self {
        Self {
            schema: schema.to_string(),
            tables: Vec::new(),
            index: HashMap::new(),
        }
    }

    /// Registers a relation. A second relation with the same name is ignored
    /// (names are unique per schema in both engines).
    pub fn add_relation(&mut self, name: String, kind: RelationKind, comment: Option<String>) {
        if self.index.contains_key(&name) {
            return;
        }
        self.index.insert(name.clone(), self.tables.len());
        self.tables
            .push(TableInfo::new(&self.schema, name, kind, comment));
    }

    fn table_mut(&mut self, name: &str) -> Option<&mut TableInfo> {
        let index = *self.index.get(name)?;
        self.tables.get_mut(index)
    }

    pub fn add_column(&mut self, table: &str, column: ColumnInfo) {
        if let Some(table) = self.table_mut(table) {
            table.columns.push(column);
        }
    }

    pub fn add_foreign_key(&mut self, table: &str, foreign_key: ForeignKeyInfo) {
        if let Some(table) = self.table_mut(table) {
            table.foreign_keys.push(foreign_key);
        }
    }

    pub fn add_check(&mut self, table: &str, check: CheckInfo) {
        if let Some(table) = self.table_mut(table) {
            table.checks.push(check);
        }
    }

    /// Groups rows by (table, constraint) keeping the order in which each
    /// constraint first appears and, within it, the order of its columns —
    /// so callers should send rows sorted by column position.
    pub fn add_key_columns(&mut self, rows: impl IntoIterator<Item = KeyColumnRow>) {
        for ((table, _), key) in group(
            rows,
            |row| (row.table.clone(), row.name.clone()),
            |row| KeyInfo {
                name: row.name.clone(),
                columns: Vec::new(),
                primary: row.primary,
            },
            |key, row| key.columns.push(row.column),
        ) {
            if let Some(table) = self.table_mut(&table) {
                table.keys.push(key);
            }
        }
    }

    pub fn add_index_columns(&mut self, rows: impl IntoIterator<Item = IndexColumnRow>) {
        for ((table, _), index) in group(
            rows,
            |row| (row.table.clone(), row.name.clone()),
            |row| IndexInfo {
                name: row.name.clone(),
                columns: Vec::new(),
                unique: row.unique,
                primary: row.primary,
                method: row.method.clone(),
            },
            |index, row| index.columns.push(row.column),
        ) {
            if let Some(table) = self.table_mut(&table) {
                table.indexes.push(index);
            }
        }
    }

    pub fn add_trigger_events(&mut self, rows: impl IntoIterator<Item = TriggerEventRow>) {
        for ((table, _), trigger) in group(
            rows,
            |row| (row.table.clone(), row.name.clone()),
            |row| TriggerInfo {
                name: row.name.clone(),
                timing: row.timing.clone(),
                events: Vec::new(),
            },
            |trigger, row| {
                if !trigger.events.contains(&row.event) {
                    trigger.events.push(row.event);
                }
            },
        ) {
            if let Some(table) = self.table_mut(&table) {
                table.triggers.push(trigger);
            }
        }
    }

    pub fn into_tables(self) -> Vec<TableInfo> {
        self.tables
    }
}

/// Groups `rows` by `key`, in first-appearance order, without requiring the
/// input to be sorted by that key (catalog views don't all honor the same
/// collation for ORDER BY, so grouping must not depend on adjacency).
fn group<R, K, T>(
    rows: impl IntoIterator<Item = R>,
    key: impl Fn(&R) -> K,
    init: impl Fn(&R) -> T,
    push: impl Fn(&mut T, R),
) -> Vec<(K, T)>
where
    K: Eq + std::hash::Hash + Clone,
{
    let mut groups: Vec<(K, T)> = Vec::new();
    let mut positions: HashMap<K, usize> = HashMap::new();
    for row in rows {
        let row_key = key(&row);
        let position = match positions.get(&row_key) {
            Some(&position) => position,
            None => {
                positions.insert(row_key.clone(), groups.len());
                groups.push((row_key, init(&row)));
                groups.len() - 1
            }
        };
        push(&mut groups[position].1, row);
    }
    groups
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set_with(tables: &[&str]) -> TableSet {
        let mut set = TableSet::new("core");
        for table in tables {
            set.add_relation(table.to_string(), RelationKind::Table, None);
        }
        set
    }

    fn key_row(table: &str, name: &str, column: &str) -> KeyColumnRow {
        KeyColumnRow {
            table: table.to_string(),
            name: name.to_string(),
            primary: name == "PRIMARY",
            column: column.to_string(),
        }
    }

    #[test]
    fn groups_multi_column_keys_in_column_order() {
        let mut set = set_with(&["orders"]);
        set.add_key_columns([
            key_row("orders", "PRIMARY", "id"),
            key_row("orders", "uq_number", "series"),
            key_row("orders", "uq_number", "number"),
        ]);

        let tables = set.into_tables();
        let keys = &tables[0].keys;
        assert_eq!(keys.len(), 2);
        assert!(keys[0].primary);
        assert_eq!(keys[1].columns, vec!["series", "number"]);
    }

    #[test]
    fn groups_non_adjacent_rows_of_the_same_constraint() {
        let mut set = set_with(&["a", "b"]);
        set.add_key_columns([
            key_row("a", "uq", "x"),
            key_row("b", "uq", "z"),
            key_row("a", "uq", "y"),
        ]);

        let tables = set.into_tables();
        assert_eq!(tables[0].keys[0].columns, vec!["x", "y"]);
        assert_eq!(tables[1].keys[0].columns, vec!["z"]);
    }

    #[test]
    fn drops_rows_for_unknown_relations() {
        let mut set = set_with(&["orders"]);
        set.add_column(
            "gone",
            ColumnInfo {
                name: "id".to_string(),
                data_type: "int".to_string(),
                nullable: false,
                is_primary_key: true,
                comment: None,
                default_value: None,
                generated: false,
            },
        );
        set.add_key_columns([key_row("gone", "PRIMARY", "id")]);

        let tables = set.into_tables();
        assert_eq!(tables.len(), 1);
        assert!(tables[0].columns.is_empty());
        assert!(tables[0].keys.is_empty());
    }

    #[test]
    fn merges_trigger_events_without_duplicates() {
        let mut set = set_with(&["orders"]);
        let row = |event: &str| TriggerEventRow {
            table: "orders".to_string(),
            name: "audit".to_string(),
            timing: "AFTER".to_string(),
            event: event.to_string(),
        };
        set.add_trigger_events([row("INSERT"), row("UPDATE"), row("INSERT")]);

        let tables = set.into_tables();
        assert_eq!(tables[0].triggers.len(), 1);
        assert_eq!(tables[0].triggers[0].events, vec!["INSERT", "UPDATE"]);
    }

    #[test]
    fn ignores_duplicate_relation_names() {
        let mut set = set_with(&["orders"]);
        set.add_relation("orders".to_string(), RelationKind::View, None);

        let tables = set.into_tables();
        assert_eq!(tables.len(), 1);
        assert_eq!(tables[0].kind, RelationKind::Table);
    }
}
