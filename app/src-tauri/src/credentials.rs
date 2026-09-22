use keyring::{Entry, Error};

const SERVICE: &str = "com.khipudb.app.connection";

fn entry(profile_id: &str) -> Result<Entry, String> {
    if profile_id.is_empty() || profile_id.len() > 128 {
        return Err("invalid connection profile identifier".to_string());
    }

    Entry::new(SERVICE, profile_id).map_err(|error| error.to_string())
}

pub async fn save(profile_id: String, password: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        entry(&profile_id)?
            .set_password(&password)
            .map_err(|error| error.to_string())
    })
    .await
    .map_err(|error| error.to_string())?
}

pub async fn load(profile_id: String) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || match entry(&profile_id)?.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    })
    .await
    .map_err(|error| error.to_string())?
}

pub async fn delete(profile_id: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || match entry(&profile_id)?.delete_credential() {
        Ok(()) | Err(Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    })
    .await
    .map_err(|error| error.to_string())?
}
