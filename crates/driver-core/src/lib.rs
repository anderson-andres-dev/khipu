use async_trait::async_trait;
use serde::{Deserialize, Serialize};

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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableInfo {
    pub schema: String,
    pub name: String,
    pub columns: Vec<ColumnInfo>,
}

#[derive(Debug, thiserror::Error)]
pub enum DriverError {
    #[error("connection failed: {0}")]
    Connection(String),
    #[error("query failed: {0}")]
    Query(String),
}

/// Implemented by each database plugin (khipu-driver-mysql, khipu-driver-postgres, ...).
/// The engine and the app only ever depend on this trait, never on a concrete driver,
/// so adding a new database is adding a new crate that implements it.
#[async_trait]
pub trait DbConnector: Send + Sync {
    async fn connect(config: &ConnectionConfig) -> Result<Self, DriverError>
    where
        Self: Sized;

    async fn list_schemas(&self) -> Result<Vec<String>, DriverError>;

    async fn list_tables(&self, schema: &str) -> Result<Vec<TableInfo>, DriverError>;
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
}
