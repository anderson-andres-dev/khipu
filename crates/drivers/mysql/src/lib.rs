use async_trait::async_trait;
use khipu_driver_core::{ColumnInfo, ConnectionConfig, DbConnector, DriverError, TableInfo};
use sqlx::mysql::{MySqlConnectOptions, MySqlPoolOptions};
use sqlx::{MySqlPool, Row};

pub struct MySqlConnector {
    pool: MySqlPool,
}

#[async_trait]
impl DbConnector for MySqlConnector {
    async fn connect(config: &ConnectionConfig) -> Result<Self, DriverError> {
        let options = MySqlConnectOptions::new()
            .host(&config.host)
            .port(config.port)
            .username(&config.username)
            .password(&config.password)
            .database(&config.database);
        let pool = MySqlPoolOptions::new()
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
            "SELECT table_name, column_name, data_type, is_nullable, column_key \
             FROM information_schema.columns WHERE table_schema = ? ORDER BY table_name, ordinal_position",
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
                    .try_get::<String, _>("column_key")
                    .map_err(|e| DriverError::Query(e.to_string()))?
                    == "PRI",
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
        let host = std::env::var("KHIPU_TEST_MYSQL_HOST")
            .expect("set KHIPU_TEST_MYSQL_HOST, KHIPU_TEST_MYSQL_PORT, KHIPU_TEST_MYSQL_USER, KHIPU_TEST_MYSQL_PASSWORD and KHIPU_TEST_MYSQL_DATABASE etc. to run this test");
        let port = std::env::var("KHIPU_TEST_MYSQL_PORT")
            .expect("set KHIPU_TEST_MYSQL_HOST, KHIPU_TEST_MYSQL_PORT, KHIPU_TEST_MYSQL_USER, KHIPU_TEST_MYSQL_PASSWORD and KHIPU_TEST_MYSQL_DATABASE etc. to run this test")
            .parse()
            .expect("KHIPU_TEST_MYSQL_PORT must be a valid u16");
        let username = std::env::var("KHIPU_TEST_MYSQL_USER")
            .expect("set KHIPU_TEST_MYSQL_HOST, KHIPU_TEST_MYSQL_PORT, KHIPU_TEST_MYSQL_USER, KHIPU_TEST_MYSQL_PASSWORD and KHIPU_TEST_MYSQL_DATABASE etc. to run this test");
        let password = std::env::var("KHIPU_TEST_MYSQL_PASSWORD")
            .expect("set KHIPU_TEST_MYSQL_HOST, KHIPU_TEST_MYSQL_PORT, KHIPU_TEST_MYSQL_USER, KHIPU_TEST_MYSQL_PASSWORD and KHIPU_TEST_MYSQL_DATABASE etc. to run this test");
        let database = std::env::var("KHIPU_TEST_MYSQL_DATABASE")
            .expect("set KHIPU_TEST_MYSQL_HOST, KHIPU_TEST_MYSQL_PORT, KHIPU_TEST_MYSQL_USER, KHIPU_TEST_MYSQL_PASSWORD and KHIPU_TEST_MYSQL_DATABASE etc. to run this test");

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
    async fn connects_and_lists_schemas_and_tables_against_real_mysql() {
        let config = config_from_env();

        let connector = MySqlConnector::connect(&config)
            .await
            .expect("connect should succeed against a reachable MySQL instance");

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
            .find(|s| s.as_str() == config.database)
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
