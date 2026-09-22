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

#[cfg(test)]
mod tests {
    use super::*;

    fn config_from_env() -> ConnectionConfig {
        let host = std::env::var("KHIPU_TEST_POSTGRES_HOST")
            .expect("set KHIPU_TEST_POSTGRES_HOST, KHIPU_TEST_POSTGRES_PORT, KHIPU_TEST_POSTGRES_USER, KHIPU_TEST_POSTGRES_PASSWORD and KHIPU_TEST_POSTGRES_DATABASE etc. to run this test");
        let port = std::env::var("KHIPU_TEST_POSTGRES_PORT")
            .expect("set KHIPU_TEST_POSTGRES_HOST, KHIPU_TEST_POSTGRES_PORT, KHIPU_TEST_POSTGRES_USER, KHIPU_TEST_POSTGRES_PASSWORD and KHIPU_TEST_POSTGRES_DATABASE etc. to run this test")
            .parse()
            .expect("KHIPU_TEST_POSTGRES_PORT must be a valid u16");
        let username = std::env::var("KHIPU_TEST_POSTGRES_USER")
            .expect("set KHIPU_TEST_POSTGRES_HOST, KHIPU_TEST_POSTGRES_PORT, KHIPU_TEST_POSTGRES_USER, KHIPU_TEST_POSTGRES_PASSWORD and KHIPU_TEST_POSTGRES_DATABASE etc. to run this test");
        let password = std::env::var("KHIPU_TEST_POSTGRES_PASSWORD")
            .expect("set KHIPU_TEST_POSTGRES_HOST, KHIPU_TEST_POSTGRES_PORT, KHIPU_TEST_POSTGRES_USER, KHIPU_TEST_POSTGRES_PASSWORD and KHIPU_TEST_POSTGRES_DATABASE etc. to run this test");
        let database = std::env::var("KHIPU_TEST_POSTGRES_DATABASE")
            .expect("set KHIPU_TEST_POSTGRES_HOST, KHIPU_TEST_POSTGRES_PORT, KHIPU_TEST_POSTGRES_USER, KHIPU_TEST_POSTGRES_PASSWORD and KHIPU_TEST_POSTGRES_DATABASE etc. to run this test");

        ConnectionConfig {
            host,
            port,
            database,
            username,
            password,
        }
    }

    #[tokio::test]
    #[ignore = "requires database"]
    async fn connects_and_lists_schemas_and_tables_against_real_postgres() {
        let config = config_from_env();

        let connector = PostgresConnector::connect(&config)
            .await
            .expect("connect should succeed against a reachable PostgreSQL instance");

        let schemas = connector
            .list_schemas()
            .await
            .expect("list_schemas should succeed");
        assert!(
            !schemas.is_empty(),
            "expected at least one schema to be reported"
        );

        let schema = schemas
            .iter()
            .find(|s| s.as_str() == "public")
            .unwrap_or_else(|| schemas.first().expect("checked non-empty above"));

        let tables = connector
            .list_tables(schema)
            .await
            .expect("list_tables should succeed");
        for table in &tables {
            assert_eq!(table.schema, *schema);
            assert!(!table.name.is_empty());
        }
    }
}
