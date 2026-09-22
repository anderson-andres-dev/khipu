use khipu_engine::catalog::SchemaCatalog;
use khipu_engine::completion::{CompletionEngine, CompletionItem};

// Placeholder catalog until connection management lands; wires the app to the
// engine crate end-to-end so the completion path is exercised from day one.
#[tauri::command]
fn complete(sql: String) -> Vec<CompletionItem> {
    let engine = CompletionEngine::new(SchemaCatalog::default());
    engine.complete(&sql)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![complete])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
