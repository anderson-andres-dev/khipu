use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::pin::Pin;

#[derive(Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

impl std::fmt::Debug for ConnectionConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ConnectionConfig")
            .field("host", &self.host)
            .field("port", &self.port)
            .field("database", &self.database)
            .field("username", &self.username)
            .field("password", &"***")
            .finish()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub is_primary_key: bool,
    pub comment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForeignKeyInfo {
    pub column: String,
    pub referenced_table: String,
    pub referenced_column: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableInfo {
    pub schema: String,
    pub name: String,
    pub columns: Vec<ColumnInfo>,
    pub foreign_keys: Vec<ForeignKeyInfo>,
}

#[derive(Debug, thiserror::Error)]
pub enum DriverError {
    #[error("connection failed: {0}")]
    Connection(String),
    #[error("query failed: {0}")]
    Query(String),
}

/// How many rows `execute_query` is allowed to return before it must stop
/// reading the result stream and report `truncated: true` instead.
#[derive(Debug, Clone, Copy)]
pub struct QueryExecutionOptions {
    pub max_rows: usize,
}

/// A column produced by executing a query, as opposed to `ColumnInfo`, which
/// describes a column of a catalog table. Query columns can be expressions,
/// aliases, or duplicated names, so they are kept separate.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryColumn {
    pub name: String,

    #[serde(rename = "type")]
    pub data_type: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub nullable: Option<bool>,
}

/// A single cell. `None` is a real SQL `NULL`; every other value (including
/// the literal strings `"NULL"`, `""` and `"0"`) is a `Some(String)`, so the
/// frontend never has to guess which one it received. The real type lives in
/// `QueryColumn::data_type`, not here — this stays a string to avoid losing
/// precision on `DECIMAL`/`NUMERIC` or integers outside JavaScript's safe range.
pub type QueryValue = Option<String>;
pub type QueryRow = Vec<QueryValue>;

/// The outcome of executing one SQL statement. A driver never turns a SQL
/// error into a `DriverError` here: that variant lives in this enum instead,
/// because the caller (the result panel) renders it as normal output, not as
/// a transport failure.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum QueryExecutionResult {
    ResultSet {
        columns: Vec<QueryColumn>,
        rows: Vec<QueryRow>,
        row_count: u64,
        execution_time_ms: u64,
        truncated: bool,
    },
    Command {
        affected_rows: u64,
        execution_time_ms: u64,
    },
    Error {
        message: String,

        #[serde(skip_serializing_if = "Option::is_none")]
        code: Option<String>,

        #[serde(skip_serializing_if = "Option::is_none")]
        position: Option<u64>,
    },
}

/// Implemented by each database driver crate (khipu-driver-mysql, khipu-driver-postgres, ...).
/// The engine depends only on this trait, never on a concrete driver. The app does
/// depend on the concrete driver crates, since it builds them through a factory
/// (`app/src-tauri/src/drivers.rs`) — adding a new database is adding a new crate
/// that implements this trait plus a branch in that factory.
#[async_trait]
pub trait DbConnector: Send + Sync {
    async fn connect(config: &ConnectionConfig) -> Result<Self, DriverError>
    where
        Self: Sized;

    async fn list_schemas(&self) -> Result<Vec<String>, DriverError>;

    async fn list_tables(&self, schema: &str) -> Result<Vec<TableInfo>, DriverError>;

    /// The DDL text for one table, fetched live from the engine (`SHOW
    /// CREATE TABLE` on MySQL; reconstructed from `pg_catalog` on Postgres,
    /// which has no single-statement equivalent). A real round trip on
    /// purpose, not a client-side rendering of the already-loaded catalog:
    /// this is what lets a missing grant (e.g. `SHOW VIEW` on MySQL) surface
    /// as a normal `DriverError::Query` instead of silently succeeding with
    /// stale/incomplete data.
    async fn table_definition(&self, schema: &str, table: &str) -> Result<String, DriverError>;

    /// Runs a single SQL statement. Never returns `DriverError`: a SQL error
    /// from the server is `QueryExecutionResult::Error`, a renderable state
    /// of the result panel rather than a transport failure. Callers are
    /// responsible for rejecting empty/multi-statement input before calling
    /// this — a driver assumes `sql` is one non-empty statement.
    ///
    /// Written as a plain method returning a boxed future (the same shape
    /// `#[async_trait]` generates for `async fn`) instead of `async fn`,
    /// because `sqlx::raw_sql(..).fetch(..)` inside an `async_trait`-boxed
    /// method fails to type-check with "implementation of `Executor` is not
    /// general enough" (a known sqlx/async-trait interaction, see
    /// launchbadge/sqlx#3591); a manual `Box::pin(async move { .. })` in the
    /// implementation sidesteps it.
    fn execute_query<'a>(
        &'a self,
        sql: &'a str,
        options: QueryExecutionOptions,
    ) -> Pin<Box<dyn Future<Output = QueryExecutionResult> + Send + 'a>>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn debug_output_redacts_password() {
        let config = ConnectionConfig {
            host: "db.example.com".to_string(),
            port: 5432,
            database: "mydb".to_string(),
            username: "myuser".to_string(),
            password: "supersecreto123".to_string(),
        };

        let debug_output = format!("{config:?}");

        assert!(!debug_output.contains("supersecreto123"));
        assert!(debug_output.contains("db.example.com"));
        assert!(debug_output.contains("myuser"));
    }

    #[test]
    fn query_column_uses_camel_case_and_omits_missing_nullable() {
        let column = QueryColumn {
            name: "id".to_string(),
            data_type: "int4".to_string(),
            nullable: None,
        };

        let value = serde_json::to_value(&column).unwrap();

        assert_eq!(
            value,
            serde_json::json!({ "name": "id", "type": "int4" })
        );
    }

    #[test]
    fn query_column_serializes_nullable_when_present() {
        let column = QueryColumn {
            name: "id".to_string(),
            data_type: "int4".to_string(),
            nullable: Some(false),
        };

        let value = serde_json::to_value(&column).unwrap();

        assert_eq!(
            value,
            serde_json::json!({ "name": "id", "type": "int4", "nullable": false })
        );
    }

    #[test]
    fn result_set_serializes_with_camel_case_discriminant() {
        let result = QueryExecutionResult::ResultSet {
            columns: vec![QueryColumn {
                name: "name".to_string(),
                data_type: "text".to_string(),
                nullable: Some(true),
            }],
            rows: vec![vec![Some("Anderson".to_string())], vec![None]],
            row_count: 2,
            execution_time_ms: 12,
            truncated: false,
        };

        let value = serde_json::to_value(&result).unwrap();

        assert_eq!(value["type"], "resultSet");
        assert_eq!(value["rowCount"], 2);
        assert_eq!(value["executionTimeMs"], 12);
        assert_eq!(value["truncated"], false);
        assert_eq!(value["rows"][0][0], "Anderson");
        assert!(value["rows"][1][0].is_null());
    }

    #[test]
    fn command_serializes_with_camel_case_discriminant() {
        let result = QueryExecutionResult::Command {
            affected_rows: 3,
            execution_time_ms: 5,
        };

        let value = serde_json::to_value(&result).unwrap();

        assert_eq!(
            value,
            serde_json::json!({ "type": "command", "affectedRows": 3, "executionTimeMs": 5 })
        );
    }

    #[test]
    fn error_omits_code_and_position_when_none() {
        let result = QueryExecutionResult::Error {
            message: "syntax error".to_string(),
            code: None,
            position: None,
        };

        let value = serde_json::to_value(&result).unwrap();

        assert_eq!(
            value,
            serde_json::json!({ "type": "error", "message": "syntax error" })
        );
    }

    #[test]
    fn error_includes_code_and_position_when_present() {
        let result = QueryExecutionResult::Error {
            message: "syntax error".to_string(),
            code: Some("42601".to_string()),
            position: Some(7),
        };

        let value = serde_json::to_value(&result).unwrap();

        assert_eq!(
            value,
            serde_json::json!({
                "type": "error",
                "message": "syntax error",
                "code": "42601",
                "position": 7
            })
        );
    }

    #[test]
    fn null_none_empty_and_zero_string_are_distinguishable_in_json() {
        let row: QueryRow = vec![
            None,
            Some("NULL".to_string()),
            Some(String::new()),
            Some("0".to_string()),
        ];

        let value = serde_json::to_value(&row).unwrap();

        assert!(value[0].is_null());
        assert_eq!(value[1], "NULL");
        assert_eq!(value[2], "");
        assert_eq!(value[3], "0");
    }
}
