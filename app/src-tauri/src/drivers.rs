use khipu_driver_core::{ConnectionConfig, DbConnector, DriverError, TableInfo};
use khipu_driver_mysql::MySqlConnector;
use khipu_driver_postgres::PostgresConnector;
use khipu_engine::Dialect;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Which database engine to connect to. Serializable so the frontend can pass
/// it straight through `invoke`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DatabaseKind {
    MySql,
    Postgres,
}

impl DatabaseKind {
    pub fn dialect(self) -> Dialect {
        match self {
            DatabaseKind::MySql => Dialect::MySql,
            DatabaseKind::Postgres => Dialect::Postgres,
        }
    }
}

/// A connector kept alive alongside the tables it introspected, so
/// `execute_query` can keep running statements against it instead of the
/// connector being dropped right after `connect` like it used to be.
pub struct ConnectedDatabase {
    pub connector: Arc<dyn DbConnector>,
    pub tables: Vec<TableInfo>,
}

/// Verifies that the credentials can open a database connection, then drops
/// the connector without loading or replacing the current catalog.
pub async fn test_connection(
    kind: DatabaseKind,
    config: &ConnectionConfig,
) -> Result<(), DriverError> {
    match kind {
        DatabaseKind::MySql => {
            MySqlConnector::connect(config).await?;
        }
        DatabaseKind::Postgres => {
            PostgresConnector::connect(config).await?;
        }
    }

    Ok(())
}

/// Connects to the given database, lists its tables, and returns the
/// connector alongside them so the caller can keep it alive for
/// `execute_query` instead of it being dropped right after introspection.
pub async fn connect(
    kind: DatabaseKind,
    config: &ConnectionConfig,
) -> Result<ConnectedDatabase, DriverError> {
    match kind {
        DatabaseKind::MySql => {
            let connector = MySqlConnector::connect(config).await?;
            let tables = connector.list_tables(&config.database).await?;
            Ok(ConnectedDatabase {
                connector: Arc::new(connector),
                tables,
            })
        }
        DatabaseKind::Postgres => {
            let connector = PostgresConnector::connect(config).await?;
            let tables = connector.list_tables("public").await?;
            Ok(ConnectedDatabase {
                connector: Arc::new(connector),
                tables,
            })
        }
    }
}
