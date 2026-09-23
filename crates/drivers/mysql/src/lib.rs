use async_trait::async_trait;
use futures_util::TryStreamExt;
use khipu_driver_core::{
    ColumnInfo, ConnectionConfig, DbConnector, DriverError, ForeignKeyInfo, QueryColumn,
    QueryExecutionOptions, QueryExecutionResult, QueryRow, QueryValue, TableInfo,
};
use sqlx::mysql::{
    MySqlConnectOptions, MySqlConnection, MySqlDatabaseError, MySqlPoolOptions, MySqlRow,
};
use sqlx::{Column, Executor, MySqlPool, Row, TypeInfo};
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::time::Instant;

pub struct MySqlConnector {
    pool: MySqlPool,
}

fn text_column(row: &MySqlRow, index: usize) -> Result<String, DriverError> {
    let bytes: Vec<u8> = row
        .try_get(index)
        .map_err(|error| DriverError::Query(error.to_string()))?;
    String::from_utf8(bytes).map_err(|error| DriverError::Query(error.to_string()))
}

/// Converts a raw cell (read as the bytes the text protocol returns) into a
/// `QueryValue`: `None` is a real `NULL`; UTF-8 bytes become the text as-is;
/// non-UTF-8 bytes (e.g. BLOB) become a stable `0x`-prefixed hex string, so
/// the grid always has something displayable without losing data.
fn mysql_cell_to_query_value(row: &MySqlRow, index: usize) -> Result<QueryValue, sqlx::Error> {
    let raw: Option<Vec<u8>> = row.try_get_unchecked(index)?;
    Ok(raw.map(|bytes| match String::from_utf8(bytes) {
        Ok(text) => text,
        Err(error) => format!("0x{}", hex_encode(error.as_bytes())),
    }))
}

fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

/// A single, unprepared statement executed via MySQL's simple query protocol
/// (`take_arguments` returning `None` is what tells sqlx not to prepare it),
/// which returns every value as text — the same generic-decode approach
/// `mysql_cell_to_query_value` relies on.
///
/// `sqlx::raw_sql` provides exactly this, but its `Execute` impl is generic
/// over every `Database`, and proving that holds inside a boxed
/// `dyn Future + Send` (as returned by `DbConnector::execute_query`) fails to
/// type-check ("implementation of `Executor` is not general enough" —
/// launchbadge/sqlx#3591, fixed upstream in sqlx 0.9 by a breaking change we
/// aren't pulling in yet). Implementing `Execute` ourselves, concretely for
/// `MySql` only, avoids the generic-over-`DB` impl that trips up that check.
struct RawStatement<'q>(&'q str);

impl<'q> sqlx::Execute<'q, sqlx::MySql> for RawStatement<'q> {
    fn sql(&self) -> &'q str {
        self.0
    }

    fn statement(&self) -> Option<&<sqlx::MySql as sqlx::Database>::Statement<'q>> {
        None
    }

    fn take_arguments(
        &mut self,
    ) -> Result<Option<<sqlx::MySql as sqlx::Database>::Arguments<'q>>, sqlx::error::BoxDynError>
    {
        Ok(None)
    }

    fn persistent(&self) -> bool {
        false
    }
}

fn mysql_error_to_result(error: sqlx::Error) -> QueryExecutionResult {
    if let sqlx::Error::Database(database_error) = &error {
        if let Some(mysql_error) = database_error.try_downcast_ref::<MySqlDatabaseError>() {
            return QueryExecutionResult::Error {
                message: mysql_error.message().to_string(),
                code: Some(mysql_error.number().to_string()),
                position: None,
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
            .map(|row| text_column(&row, 0))
            .collect()
    }

    async fn list_tables(&self, schema: &str) -> Result<Vec<TableInfo>, DriverError> {
        let rows = sqlx::query(
            "SELECT table_name, column_name, data_type, is_nullable, column_key, column_comment \
             FROM information_schema.columns WHERE table_schema = ? ORDER BY table_name, ordinal_position",
        )
        .bind(schema)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DriverError::Query(e.to_string()))?;

        let mut tables: Vec<TableInfo> = Vec::new();
        for row in rows {
            let table_name = text_column(&row, 0)?;
            // MySQL nunca devuelve NULL en column_comment, usa "" cuando no
            // hay comentario — se normaliza a None para no mostrar un
            // tooltip con una segunda linea vacia.
            let comment = text_column(&row, 5)?;
            let column = ColumnInfo {
                name: text_column(&row, 1)?,
                data_type: text_column(&row, 2)?,
                nullable: text_column(&row, 3)? == "YES",
                is_primary_key: row
                    .try_get::<Option<Vec<u8>>, _>(4)
                    .map_err(|e| DriverError::Query(e.to_string()))?
                    .as_deref()
                    == Some(b"PRI"),
                comment: if comment.is_empty() {
                    None
                } else {
                    Some(comment)
                },
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
            "SELECT table_name, column_name, referenced_table_name, referenced_column_name \
             FROM information_schema.key_column_usage \
             WHERE table_schema = ? AND referenced_table_name IS NOT NULL",
        )
        .bind(schema)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DriverError::Query(e.to_string()))?;

        for row in fk_rows {
            let table_name = text_column(&row, 0)?;
            let Some(&index) = table_index.get(table_name.as_str()) else {
                continue;
            };
            tables[index].foreign_keys.push(ForeignKeyInfo {
                column: text_column(&row, 1)?,
                referenced_table: text_column(&row, 2)?,
                referenced_column: text_column(&row, 3)?,
            });
        }

        Ok(tables)
    }

    async fn table_definition(&self, schema: &str, table: &str) -> Result<String, DriverError> {
        // Los identificadores no se pueden bindear como parametros (solo
        // valores); se escapan a mano (backtick duplicado, la convencion de
        // MySQL) e interpolan en el SQL en vez de bindearlos.
        let sql = format!(
            "SHOW CREATE TABLE `{}`.`{}`",
            schema.replace('`', "``"),
            table.replace('`', "``")
        );

        let row = sqlx::query(&sql)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DriverError::Query(e.to_string()))?;

        text_column(&row, 1)
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
                Err(error) => return mysql_error_to_result(error),
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
/// connection can go back to the pool clean. MySQL can't stop sending a
/// result set midway: whatever isn't read here, sqlx reads on release
/// (`ping` -> `wait_until_ready`) before reusing the connection. Without a
/// bound, a `SELECT * FROM big_table` that shows 500 rows downloads the
/// whole table in the background, and a few of those in a row starve the
/// pool — every later query, even `SELECT 1`, waits up to `acquire_timeout`.
/// Past this bound the connection is discarded instead (see
/// `ExecutionOutcome::connection_reusable`).
const MAX_ROWS_TO_DRAIN: usize = 1000;

struct ExecutionOutcome {
    result: QueryExecutionResult,
    /// `false` when the connection still has unread rows pending (or its
    /// session state couldn't be restored) and must not go back to the pool.
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
    conn: &mut MySqlConnection,
    sql: &str,
    options: QueryExecutionOptions,
) -> ExecutionOutcome {
    let start = Instant::now();

    let describe = match conn.describe(sql).await {
        Ok(describe) => describe,
        Err(error) => return mysql_error_to_result(error).into(),
    };

    if describe.columns().is_empty() {
        let outcome = match Executor::execute(&mut *conn, RawStatement(sql)).await {
            Ok(outcome) => outcome,
            Err(error) => return mysql_error_to_result(error).into(),
        };
        return QueryExecutionResult::Command {
            affected_rows: outcome.rows_affected(),
            execution_time_ms: start.elapsed().as_millis() as u64,
        }
        .into();
    }

    // El servidor deja de producir filas en max_rows + 1 (la extra es solo
    // para saber si hubo truncado) en vez de mandar la tabla entera: es lo
    // mismo que hace Connector/J con setMaxRows. Solo afecta al SELECT de
    // nivel superior — no a subconsultas ni a INSERT ... SELECT — y un LIMIT
    // explicito en la consulta tiene prioridad sobre esto. Si el SET falla
    // (un servidor que no lo soporte) la consulta corre igual y la cota de
    // MAX_ROWS_TO_DRAIN sigue protegiendo el pool.
    let select_limit_set = Executor::execute(
        &mut *conn,
        RawStatement(&format!(
            "SET SESSION sql_select_limit = {}",
            options.max_rows + 1
        )),
    )
    .await
    .is_ok();

    let mut outcome = read_result_set(conn, sql, &describe, options, start).await;

    // La conexion vuelve al pool y la usa despues el catalogo (information_
    // schema), que no puede quedar limitado a 501 filas. Si no se pudo
    // restaurar, no se reutiliza.
    if select_limit_set && outcome.connection_reusable {
        let restored = Executor::execute(
            &mut *conn,
            RawStatement("SET SESSION sql_select_limit = DEFAULT"),
        )
        .await
        .is_ok();
        outcome.connection_reusable = restored;
    }

    outcome
}

async fn read_result_set(
    conn: &mut MySqlConnection,
    sql: &str,
    describe: &sqlx::Describe<sqlx::MySql>,
    options: QueryExecutionOptions,
    start: Instant,
) -> ExecutionOutcome {
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
                    result: mysql_error_to_result(error),
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

        let mut query_row = Vec::with_capacity(columns.len());
        for index in 0..columns.len() {
            match mysql_cell_to_query_value(&row, index) {
                Ok(value) => query_row.push(value),
                Err(error) => {
                    return ExecutionOutcome {
                        result: mysql_error_to_result(error),
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

    #[tokio::test]
    #[ignore = "requires database"]
    async fn execute_query_returns_result_set_with_null_and_types() {
        let connector = MySqlConnector::connect(&config_from_env())
            .await
            .expect("connect should succeed against a reachable MySQL instance");

        let result = connector
            .execute_query(
                "SELECT 1 AS id, 'Anderson' AS name, NULL AS email",
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
        let connector = MySqlConnector::connect(&config_from_env())
            .await
            .expect("connect should succeed against a reachable MySQL instance");

        let result = connector
            .execute_query(
                "SELECT * FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3) AS t",
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

    async fn raw_connection(config: &ConnectionConfig) -> MySqlConnection {
        use sqlx::Connection;
        let options = MySqlConnectOptions::new()
            .host(&config.host)
            .port(config.port)
            .username(&config.username)
            .password(&config.password)
            .database(&config.database);
        MySqlConnection::connect_with(&options)
            .await
            .expect("connect should succeed against a reachable MySQL instance")
    }

    // El servidor corta en max_rows + 1 (sql_select_limit), asi que tras
    // truncar no queda nada pendiente en la conexion; y el limite se
    // restaura, porque la misma conexion la usa despues el catalogo.
    #[tokio::test]
    #[ignore = "requires database"]
    async fn truncated_query_leaves_connection_reusable_and_unlimited() {
        let mut conn = raw_connection(&config_from_env()).await;

        let outcome = execute_on_connection(
            &mut conn,
            "WITH RECURSIVE s(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM s WHERE n < 900) SELECT n FROM s",
            QueryExecutionOptions { max_rows: 2 },
        )
        .await;

        match outcome.result {
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
        assert!(outcome.connection_reusable);

        let limit: u64 = sqlx::query_scalar("SELECT @@SESSION.sql_select_limit")
            .fetch_one(&mut conn)
            .await
            .expect("reading sql_select_limit should succeed");
        assert_eq!(
            limit,
            u64::MAX,
            "sql_select_limit must be back to its default"
        );
    }

    #[tokio::test]
    #[ignore = "requires database"]
    async fn execute_query_returns_command_for_ddl() {
        let connector = MySqlConnector::connect(&config_from_env())
            .await
            .expect("connect should succeed against a reachable MySQL instance");

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
    async fn execute_query_returns_error_with_code_for_bad_sql() {
        let connector = MySqlConnector::connect(&config_from_env())
            .await
            .expect("connect should succeed against a reachable MySQL instance");

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
                    "expected MySQL to report a numeric error code"
                );
            }
            other => panic!("expected an Error result, got {other:?}"),
        }
    }
}
