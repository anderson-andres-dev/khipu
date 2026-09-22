mod catalog_adapter;
mod credentials;
mod drivers;

use khipu_driver_core::ConnectionConfig;
use khipu_engine::catalog::SchemaCatalog;
use khipu_engine::completion::{CompletionEngine, CompletionItem};
use std::sync::Mutex;

/// Holds the catalog loaded by the most recent `connect` call, if any.
#[derive(Default)]
struct AppState {
    catalog: Mutex<Option<SchemaCatalog>>,
}

#[tauri::command]
fn complete(sql: String, state: tauri::State<'_, AppState>) -> Vec<CompletionItem> {
    let catalog = state
        .catalog
        .lock()
        .expect("catalog mutex poisoned")
        .clone()
        .unwrap_or_default();
    let engine = CompletionEngine::new(catalog);
    engine.complete(&sql)
}

#[tauri::command]
async fn connect(
    kind: drivers::DatabaseKind,
    config: ConnectionConfig,
    state: tauri::State<'_, AppState>,
) -> Result<usize, String> {
    let tables = drivers::connect(kind, &config)
        .await
        .map_err(|e| e.to_string())?;
    let catalog = catalog_adapter::tables_to_catalog(tables);
    let table_count = catalog.tables.len();

    *state.catalog.lock().expect("catalog mutex poisoned") = Some(catalog);

    Ok(table_count)
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
            complete,
            connect,
            test_connection,
            save_connection_password,
            load_connection_password,
            delete_connection_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
