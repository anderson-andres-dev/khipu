use async_trait::async_trait;
use khipu_driver_core::{ColumnInfo, ConnectionConfig, DbConnector, DriverError, TableInfo};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::{PgPool, Row};

pub struct PostgresConnector {
    pool: PgPool,
}

#[async_trait]
impl DbConnector for PostgresConnector {
    async fn connect(config: &ConnectionConfig) -> Result<Self, DriverError> {
        let options = PgConnectOptions::new()
            .host(&config.host)
            .port(config.port)
            .username(&config.username)
            .password(&config.password)
            .database(&config.database);
        let pool = PgPoolOptions::new()
            .connect_with(options)
            .await
            .map_err(|e| DriverError::Connection(e.to_string()))?;
        Ok(Self { pool })
    }

    async fn list_schemas(&self) -> Result<Vec<String>, DriverError> {
        sqlx::query("SELECT schema_name FROM information_schema.schemata")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DriverError::Query(e.to_string()))?
            .into_iter()
            .map(|row| {
                row.try_get::<String, _>(0)
                    .map_err(|e| DriverError::Query(e.to_string()))
            })
            .collect()
    }

    async fn list_tables(&self, schema: &str) -> Result<Vec<TableInfo>, DriverError> {
        let rows = sqlx::query(
            "SELECT table_name, column_name, data_type, is_nullable, \
             (SELECT COUNT(*) FROM information_schema.table_constraints tc \
              JOIN information_schema.key_column_usage kcu \
                ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema \
              WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = c.table_schema \
                AND tc.table_name = c.table_name AND kcu.column_name = c.column_name) > 0 AS is_pk \
             FROM information_schema.columns c WHERE table_schema = $1 ORDER BY table_name, ordinal_position",
        )
        .bind(schema)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DriverError::Query(e.to_string()))?;

        let mut tables: Vec<TableInfo> = Vec::new();
        for row in rows {
            let table_name: String = row
                .try_get("table_name")
                .map_err(|e| DriverError::Query(e.to_string()))?;
            let column = ColumnInfo {
                name: row
                    .try_get("column_name")
                    .map_err(|e| DriverError::Query(e.to_string()))?,
                data_type: row
                    .try_get("data_type")
                    .map_err(|e| DriverError::Query(e.to_string()))?,
                nullable: row
                    .try_get::<String, _>("is_nullable")
                    .map_err(|e| DriverError::Query(e.to_string()))?
                    == "YES",
                is_primary_key: row
                    .try_get("is_pk")
                    .map_err(|e| DriverError::Query(e.to_string()))?,
            };

            match tables.last_mut() {
                Some(t) if t.name == table_name => t.columns.push(column),
                _ => tables.push(TableInfo {
                    schema: schema.to_string(),
                    name: table_name,
                    columns: vec![column],
                }),
            }
        }

        Ok(tables)
    }
}
