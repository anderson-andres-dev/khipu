use khipu_driver_core::{ConnectionConfig, DbConnector, DriverError, TableInfo};
use khipu_driver_mysql::MySqlConnector;
use khipu_driver_postgres::PostgresConnector;
use serde::{Deserialize, Serialize};

/// Which database engine to connect to. Serializable so the frontend can pass
/// it straight through `invoke`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DatabaseKind {
    MySql,
    Postgres,
}

/// Connects to the given database, lists its tables, and drops the
/// connection/pool before returning. Callers only ever see the resulting
/// `TableInfo`s, never the live connector.
pub async fn connect(
    kind: DatabaseKind,
    config: &ConnectionConfig,
) -> Result<Vec<TableInfo>, DriverError> {
    match kind {
        DatabaseKind::MySql => {
            let connector = MySqlConnector::connect(config).await?;
            connector.list_tables(&config.database).await
        }
        DatabaseKind::Postgres => {
            let connector = PostgresConnector::connect(config).await?;
            connector.list_tables("public").await
        }
    }
}
