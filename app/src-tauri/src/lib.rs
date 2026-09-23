mod catalog_adapter;
mod credentials;
mod drivers;

use khipu_driver_core::{ConnectionConfig, DbConnector, QueryExecutionOptions, QueryExecutionResult};
use khipu_engine::catalog::{CatalogTable, SchemaCatalog};
use khipu_engine::execution_guard::{classify_destructive_sql, DestructiveClassification, DestructiveStatement};
use khipu_engine::Dialect;
use serde::Serialize;
use std::sync::{Arc, Mutex};

/// How many rows `execute_query` returns before reporting `truncated: true`.
/// Not configurable from the frontend yet: accepting an arbitrary value from
/// the WebView would let it opt out of the protection entirely.
const DEFAULT_QUERY_ROW_LIMIT: usize = 500;

/// The connector and catalog from the most recent successful `connect`, kept
/// alive so `execute_query` has something to run statements against instead
/// of the connection being dropped right after introspection.
struct ActiveConnection {
    connector: Arc<dyn DbConnector>,
    catalog: SchemaCatalog,
    dialect: Dialect,
}

#[derive(Default)]
struct AppState {
    active_connection: Mutex<Option<ActiveConnection>>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum ExecuteQueryResponse {
    ConfirmationRequired { statement: DestructiveStatement },
    Completed { result: QueryExecutionResult },
}

#[tauri::command]
fn list_tables(state: tauri::State<'_, AppState>) -> Vec<CatalogTable> {
    state
        .active_connection
        .lock()
        .expect("active connection mutex poisoned")
        .as_ref()
        .map(|active| active.catalog.tables.clone())
        .unwrap_or_default()
}

#[tauri::command]
async fn connect(
    kind: drivers::DatabaseKind,
    config: ConnectionConfig,
    state: tauri::State<'_, AppState>,
) -> Result<usize, String> {
    let connected = drivers::connect(kind, &config)
        .await
        .map_err(|e| e.to_string())?;
    let catalog = catalog_adapter::tables_to_catalog(connected.tables);
    let table_count = catalog.tables.len();

    *state
        .active_connection
        .lock()
        .expect("active connection mutex poisoned") = Some(ActiveConnection {
        connector: connected.connector,
        catalog,
        dialect: kind.dialect(),
    });

    Ok(table_count)
}

#[tauri::command]
fn disconnect(state: tauri::State<'_, AppState>) {
    *state
        .active_connection
        .lock()
        .expect("active connection mutex poisoned") = None;
}

#[tauri::command]
async fn execute_query(
    sql: String,
    confirmed_statement: Option<DestructiveStatement>,
    state: tauri::State<'_, AppState>,
) -> Result<ExecuteQueryResponse, String> {
    let sql = sql.trim();
    if sql.is_empty() {
        return Ok(ExecuteQueryResponse::Completed {
            result: QueryExecutionResult::Error {
                message: "No hay ninguna consulta para ejecutar.".to_string(),
                code: None,
                position: None,
            },
        });
    }

    let (connector, dialect) = {
        let guard = state
            .active_connection
            .lock()
            .expect("active connection mutex poisoned");
        match guard.as_ref() {
            Some(active) => (Arc::clone(&active.connector), active.dialect),
            None => {
                return Ok(ExecuteQueryResponse::Completed {
                    result: QueryExecutionResult::Error {
                        message: "No hay ninguna conexión activa.".to_string(),
                        code: None,
                        position: None,
                    },
                });
            }
        }
    };

    let classification = match classify_destructive_sql(sql, dialect) {
        Ok(classification) => classification,
        Err(error) => {
            return Ok(ExecuteQueryResponse::Completed {
                result: QueryExecutionResult::Error {
                    message: error.to_string(),
                    code: None,
                    position: None,
                },
            });
        }
    };

    match (classification, confirmed_statement) {
        (DestructiveClassification::NotDestructive, None) => {}
        (DestructiveClassification::RequiresConfirmation(statement), Some(confirmed))
            if confirmed == statement => {}
        (DestructiveClassification::RequiresConfirmation(statement), _) => {
            return Ok(ExecuteQueryResponse::ConfirmationRequired { statement });
        }
        (DestructiveClassification::NotDestructive, Some(_)) => {
            return Ok(ExecuteQueryResponse::Completed {
                result: QueryExecutionResult::Error {
                    message: "La confirmación ya no corresponde a esta consulta.".to_string(),
                    code: None,
                    position: None,
                },
            });
        }
    }

    let result = connector
        .execute_query(
            sql,
            QueryExecutionOptions {
                max_rows: DEFAULT_QUERY_ROW_LIMIT,
            },
        )
        .await;

    Ok(ExecuteQueryResponse::Completed { result })
}

#[tauri::command]
async fn test_connection(
    kind: drivers::DatabaseKind,
    config: ConnectionConfig,
) -> Result<(), String> {
    drivers::test_connection(kind, &config)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_connection_password(profile_id: String, password: String) -> Result<(), String> {
    credentials::save(profile_id, password).await
}

#[tauri::command]
async fn load_connection_password(profile_id: String) -> Result<Option<String>, String> {
    credentials::load(profile_id).await
}

#[tauri::command]
async fn delete_connection_password(profile_id: String) -> Result<(), String> {
    credentials::delete(profile_id).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            list_tables,
            connect,
            disconnect,
            execute_query,
            test_connection,
            save_connection_password,
            load_connection_password,
            delete_connection_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
