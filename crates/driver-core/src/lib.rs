use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
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
