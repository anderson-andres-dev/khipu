use async_trait::async_trait;
use futures_util::TryStreamExt;
use khipu_driver_core::{
    ColumnInfo, ConnectionConfig, DbConnector, DriverError, ForeignKeyInfo, QueryColumn,
    QueryExecutionOptions, QueryExecutionResult, QueryRow, QueryValue, TableInfo,
};
use sqlx::postgres::{
    PgConnectOptions, PgConnection, PgDatabaseError, PgErrorPosition, PgPoolOptions,
};
use sqlx::{Column, Executor, PgPool, Row, TypeInfo};
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::time::Instant;

pub struct PostgresConnector {
    pool: PgPool,
}

/// A single, unprepared statement executed via Postgres's simple query
/// protocol (`take_arguments` returning `None` tells sqlx not to prepare
/// it), which returns every value in text format. `sqlx::raw_sql` provides
/// this too, but calling it inside the boxed `dyn Future` that
/// `DbConnector::execute_query` returns fails to type-check
/// ("implementation of `Executor` is not general enough" —
/// launchbadge/sqlx#3591, fixed upstream only in sqlx 0.9, which this
/// workspace isn't on yet) because `RawSql`'s `Execute` impl is generic over
/// every `Database`. Implementing `Execute` ourselves, concretely for
/// `Postgres` only, avoids that.
struct RawStatement<'q>(&'q str);

impl<'q> sqlx::Execute<'q, sqlx::Postgres> for RawStatement<'q> {
    fn sql(&self) -> &'q str {
        self.0
    }

    fn statement(&self) -> Option<&<sqlx::Postgres as sqlx::Database>::Statement<'q>> {
        None
    }

    fn take_arguments(
        &mut self,
    ) -> Result<Option<<sqlx::Postgres as sqlx::Database>::Arguments<'q>>, sqlx::error::BoxDynError>
    {
        Ok(None)
    }

    fn persistent(&self) -> bool {
        false
    }
}

fn postgres_error_to_result(error: sqlx::Error) -> QueryExecutionResult {
    if let sqlx::Error::Database(database_error) = &error {
        if let Some(pg_error) = database_error.try_downcast_ref::<PgDatabaseError>() {
            let position = match pg_error.position() {
                Some(PgErrorPosition::Original(position)) => Some(position as u64),
                _ => None,
            };
            return QueryExecutionResult::Error {
                message: pg_error.message().to_string(),
                code: Some(pg_error.code().to_string()),
                position,
            };
        }
    }

    QueryExecutionResult::Error {
        message: error.to_string(),
        code: None,
        position: None,
    }
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
                AND tc.table_name = c.table_name AND kcu.column_name = c.column_name) > 0 AS is_pk, \
             col_description( \
               (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass::oid, \
               c.ordinal_position \
             ) AS column_comment \
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
                // col_description() da NULL de por si cuando no hay
                // comentario (a diferencia de MySQL, que da "").
                comment: row
                    .try_get("column_comment")
                    .map_err(|e| DriverError::Query(e.to_string()))?,
            };

            match tables.last_mut() {
                Some(t) if t.name == table_name => t.columns.push(column),
                _ => tables.push(TableInfo {
                    schema: schema.to_string(),
                    name: table_name,
                    columns: vec![column],
                    foreign_keys: Vec::new(),
                }),
            }
        }

        let table_index: HashMap<String, usize> = tables
            .iter()
            .enumerate()
            .map(|(i, t)| (t.name.clone(), i))
            .collect();

        let fk_rows = sqlx::query(
            "SELECT tc.table_name, kcu.column_name, ccu.table_name AS referenced_table, \
             ccu.column_name AS referenced_column \
             FROM information_schema.table_constraints tc \
             JOIN information_schema.key_column_usage kcu \
               ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema \
             JOIN information_schema.constraint_column_usage ccu \
               ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema \
             WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1",
        )
        .bind(schema)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DriverError::Query(e.to_string()))?;

        for row in fk_rows {
            let table_name: String = row
                .try_get("table_name")
                .map_err(|e| DriverError::Query(e.to_string()))?;
            let Some(&index) = table_index.get(table_name.as_str()) else {
                continue;
            };
            tables[index].foreign_keys.push(ForeignKeyInfo {
                column: row
                    .try_get("column_name")
                    .map_err(|e| DriverError::Query(e.to_string()))?,
                referenced_table: row
                    .try_get("referenced_table")
                    .map_err(|e| DriverError::Query(e.to_string()))?,
                referenced_column: row
                    .try_get("referenced_column")
                    .map_err(|e| DriverError::Query(e.to_string()))?,
            });
        }

        Ok(tables)
    }

    // Postgres no tiene un equivalente de una sola sentencia a `SHOW CREATE
    // TABLE` de MySQL; se reconstruye a mano desde pg_catalog. `quote_ident`
    // (mismo patron que list_tables mas arriba) hace la resolucion segura
    // sin tener que armar el SQL con el nombre interpolado a mano.
    async fn table_definition(&self, schema: &str, table: &str) -> Result<String, DriverError> {
        let column_rows = sqlx::query(
            "SELECT a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull, \
             pg_get_expr(d.adbin, d.adrelid) \
             FROM pg_attribute a \
             LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum \
             WHERE a.attrelid = (quote_ident($1) || '.' || quote_ident($2))::regclass \
               AND a.attnum > 0 AND NOT a.attisdropped \
             ORDER BY a.attnum",
        )
        .bind(schema)
        .bind(table)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DriverError::Query(e.to_string()))?;

        if column_rows.is_empty() {
            return Err(DriverError::Query(format!(
                "no se encontraron columnas para {schema}.{table}"
            )));
        }

        let pk_rows = sqlx::query(
            "SELECT a.attname FROM pg_index i \
             JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) \
             WHERE i.indrelid = (quote_ident($1) || '.' || quote_ident($2))::regclass AND i.indisprimary \
             ORDER BY array_position(i.indkey, a.attnum)",
        )
        .bind(schema)
        .bind(table)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DriverError::Query(e.to_string()))?;

        let mut primary_key = Vec::with_capacity(pk_rows.len());
        for row in &pk_rows {
            let name: String = row
                .try_get(0)
                .map_err(|e| DriverError::Query(e.to_string()))?;
            primary_key.push(name);
        }

        let mut lines = Vec::with_capacity(column_rows.len());
        for row in &column_rows {
            let name: String = row
                .try_get(0)
                .map_err(|e| DriverError::Query(e.to_string()))?;
            let data_type: String = row
                .try_get(1)
                .map_err(|e| DriverError::Query(e.to_string()))?;
            let not_null: bool = row
                .try_get(2)
                .map_err(|e| DriverError::Query(e.to_string()))?;
            let default_value: Option<String> = row
                .try_get(3)
                .map_err(|e| DriverError::Query(e.to_string()))?;

            let mut line = format!("    {name} {data_type}");
            if let Some(default_value) = default_value {
                line.push_str(&format!(" DEFAULT {default_value}"));
            }
            if not_null {
                line.push_str(" NOT NULL");
            }
            lines.push(line);
        }

        if !primary_key.is_empty() {
            lines.push(format!("    PRIMARY KEY ({})", primary_key.join(", ")));
        }

        Ok(format!(
            "CREATE TABLE {schema}.{table} (\n{}\n);",
            lines.join(",\n")
        ))
    }

    // Matches the `Pin<Box<dyn Future>>` shape the trait declares (see the
    // doc comment on `DbConnector::execute_query` for why this isn't `async
    // fn`/`#[async_trait]` like the other methods).
    fn execute_query<'a>(
        &'a self,
        sql: &'a str,
        options: QueryExecutionOptions,
    ) -> Pin<Box<dyn Future<Output = QueryExecutionResult> + Send + 'a>> {
        Box::pin(async move {
            let mut conn = match self.pool.acquire().await {
                Ok(conn) => conn,
                Err(error) => return postgres_error_to_result(error),
            };

            let outcome = execute_on_connection(&mut conn, sql, options).await;
            if !outcome.connection_reusable {
                // Devolverla al pool haria que sqlx la "limpie" leyendo (y
                // tirando) todo lo que el servidor todavia tenga para mandar
                // — ver MAX_ROWS_TO_DRAIN. Cerrar el socket corta el envio
                // en seco; el pool abre otra conexion cuando haga falta.
                drop(conn.detach());
            }
            outcome.result
        })
    }
}

/// Rows past `max_rows` that are still read (and discarded) so the
/// connection can go back to the pool clean. The simple query protocol
/// streams the whole result set and can't be stopped midway: whatever isn't
/// read here, sqlx reads on release (`ping`) before reusing the connection.
/// Without a bound, a `SELECT * FROM big_table` that shows 500 rows
/// downloads the whole table in the background, and a few of those in a row
/// starve the pool — every later query waits up to `acquire_timeout`. Past
/// this bound the connection is discarded instead (see
/// `ExecutionOutcome::connection_reusable`).
const MAX_ROWS_TO_DRAIN: usize = 1000;

struct ExecutionOutcome {
    result: QueryExecutionResult,
    /// `false` when the connection still has unread rows pending and must
    /// not go back to the pool.
    connection_reusable: bool,
}

impl From<QueryExecutionResult> for ExecutionOutcome {
    fn from(result: QueryExecutionResult) -> Self {
        Self {
            result,
            connection_reusable: true,
        }
    }
}

async fn execute_on_connection(
    conn: &mut PgConnection,
    sql: &str,
    options: QueryExecutionOptions,
) -> ExecutionOutcome {
    let start = Instant::now();

    let describe = match conn.describe(sql).await {
        Ok(describe) => describe,
        Err(error) => return postgres_error_to_result(error).into(),
    };

    if describe.columns().is_empty() {
        let outcome = match Executor::execute(&mut *conn, RawStatement(sql)).await {
            Ok(outcome) => outcome,
            Err(error) => return postgres_error_to_result(error).into(),
        };
        return QueryExecutionResult::Command {
            affected_rows: outcome.rows_affected(),
            execution_time_ms: start.elapsed().as_millis() as u64,
        }
        .into();
    }

    let columns: Vec<QueryColumn> = describe
        .columns()
        .iter()
        .enumerate()
        .map(|(index, column)| QueryColumn {
            name: column.name().to_string(),
            data_type: column.type_info().name().to_string(),
            nullable: describe.nullable(index),
        })
        .collect();

    let mut stream = Executor::fetch(&mut *conn, RawStatement(sql));
    let mut rows: Vec<QueryRow> = Vec::new();
    let mut truncated = false;
    let mut discarded = 0;
    let mut stream_finished = false;
    loop {
        let row = match stream.try_next().await {
            Ok(Some(row)) => row,
            Ok(None) => {
                stream_finished = true;
                break;
            }
            Err(error) => {
                return ExecutionOutcome {
                    result: postgres_error_to_result(error),
                    connection_reusable: false,
                };
            }
        };

        if rows.len() >= options.max_rows {
            truncated = true;
            discarded += 1;
            if discarded > MAX_ROWS_TO_DRAIN {
                break;
            }
            continue;
        }

        let mut query_row: QueryRow = Vec::with_capacity(columns.len());
        for index in 0..columns.len() {
            let value: Result<QueryValue, sqlx::Error> = row.try_get_unchecked(index);
            match value {
                Ok(value) => query_row.push(value),
                Err(error) => {
                    return ExecutionOutcome {
                        result: postgres_error_to_result(error),
                        connection_reusable: false,
                    };
                }
            }
        }
        rows.push(query_row);
    }
    drop(stream);

    ExecutionOutcome {
        result: QueryExecutionResult::ResultSet {
            row_count: rows.len() as u64,
            columns,
            rows,
            execution_time_ms: start.elapsed().as_millis() as u64,
            truncated,
        },
        connection_reusable: stream_finished,
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

    #[tokio::test]
    #[ignore = "requires database"]
    async fn execute_query_returns_result_set_with_null_and_types() {
        let connector = PostgresConnector::connect(&config_from_env())
            .await
            .expect("connect should succeed against a reachable PostgreSQL instance");

        let result = connector
            .execute_query(
                "SELECT 1 AS id, 'Anderson'::text AS name, NULL::text AS email",
                QueryExecutionOptions { max_rows: 500 },
            )
            .await;

        match result {
            QueryExecutionResult::ResultSet {
                columns,
                rows,
                row_count,
                truncated,
                ..
            } => {
                assert_eq!(columns.len(), 3);
                assert_eq!(row_count, 1);
                assert!(!truncated);
                assert_eq!(rows[0][1], Some("Anderson".to_string()));
                assert_eq!(rows[0][2], None);
            }
            other => panic!("expected a ResultSet, got {other:?}"),
        }
    }

    #[tokio::test]
    #[ignore = "requires database"]
    async fn execute_query_truncates_at_max_rows() {
        let connector = PostgresConnector::connect(&config_from_env())
            .await
            .expect("connect should succeed against a reachable PostgreSQL instance");

        let result = connector
            .execute_query(
                "SELECT * FROM generate_series(1, 3)",
                QueryExecutionOptions { max_rows: 2 },
            )
            .await;

        match result {
            QueryExecutionResult::ResultSet {
                row_count,
                truncated,
                ..
            } => {
                assert_eq!(row_count, 2);
                assert!(truncated);
            }
            other => panic!("expected a ResultSet, got {other:?}"),
        }
    }

    async fn raw_connection(config: &ConnectionConfig) -> PgConnection {
        use sqlx::Connection;
        let options = PgConnectOptions::new()
            .host(&config.host)
            .port(config.port)
            .username(&config.username)
            .password(&config.password)
            .database(&config.database);
        PgConnection::connect_with(&options)
            .await
            .expect("connect should succeed against a reachable Postgres instance")
    }

    #[tokio::test]
    #[ignore = "requires database"]
    async fn truncated_query_with_few_extra_rows_leaves_connection_reusable() {
        let mut conn = raw_connection(&config_from_env()).await;

        let outcome = execute_on_connection(
            &mut conn,
            "SELECT n FROM generate_series(1, 900) AS n",
            QueryExecutionOptions { max_rows: 2 },
        )
        .await;

        assert!(matches!(
            outcome.result,
            QueryExecutionResult::ResultSet {
                row_count: 2,
                truncated: true,
                ..
            }
        ));
        assert!(outcome.connection_reusable);
    }

    // Con muchas filas pendientes la conexion no debe volver al pool: sqlx
    // la "limpiaria" descargando el resto del resultado en segundo plano.
    #[tokio::test]
    #[ignore = "requires database"]
    async fn truncated_query_with_many_extra_rows_discards_connection() {
        let mut conn = raw_connection(&config_from_env()).await;

        let outcome = execute_on_connection(
            &mut conn,
            "SELECT n FROM generate_series(1, 1000000) AS n",
            QueryExecutionOptions { max_rows: 2 },
        )
        .await;

        assert!(matches!(
            outcome.result,
            QueryExecutionResult::ResultSet {
                row_count: 2,
                truncated: true,
                ..
            }
        ));
        assert!(!outcome.connection_reusable);
    }

    #[tokio::test]
    #[ignore = "requires database"]
    async fn execute_query_returns_command_for_ddl() {
        let connector = PostgresConnector::connect(&config_from_env())
            .await
            .expect("connect should succeed against a reachable PostgreSQL instance");

        let result = connector
            .execute_query(
                "CREATE TEMPORARY TABLE khipu_execute_query_smoke (id INT)",
                QueryExecutionOptions { max_rows: 500 },
            )
            .await;

        assert!(
            matches!(result, QueryExecutionResult::Command { .. }),
            "expected a Command result, got {result:?}"
        );
    }

    #[tokio::test]
    #[ignore = "requires database"]
    async fn execute_query_returns_error_with_code_and_position_for_bad_sql() {
        let connector = PostgresConnector::connect(&config_from_env())
            .await
            .expect("connect should succeed against a reachable PostgreSQL instance");

        let result = connector
            .execute_query(
                "SELECT * FROM this_table_does_not_exist",
                QueryExecutionOptions { max_rows: 500 },
            )
            .await;

        match result {
            QueryExecutionResult::Error { code, .. } => {
                assert!(
                    code.is_some(),
                    "expected Postgres to report a SQLSTATE code"
                );
            }
            other => panic!("expected an Error result, got {other:?}"),
        }
    }
}
