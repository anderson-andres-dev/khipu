//! Lectura y escritura de scripts `.sql` del usuario.
//!
//! Las rutas llegan desde el frontend (elegidas en los dialogos nativos de
//! abrir/guardar), asi que estos comandos solo aceptan archivos con
//! extension `.sql`: no sirven para leer ni pisar otros archivos del disco.

use serde::Serialize;
use std::path::{Path, PathBuf};

fn sql_path(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    if !path.is_absolute() {
        return Err("la ruta del archivo debe ser absoluta".to_string());
    }
    let is_sql = path
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("sql"));
    if !is_sql {
        return Err("solo se admiten archivos .sql".to_string());
    }
    Ok(path)
}

fn absolute_dir(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    if !path.is_absolute() {
        return Err("la ruta de la carpeta debe ser absoluta".to_string());
    }
    Ok(path)
}

fn is_sql_file_name(name: &str) -> bool {
    Path::new(name)
        .extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case("sql"))
}

/// Nombre de archivo escrito por el usuario: sin separadores de carpeta y
/// con `.sql` agregado si no lo trae.
fn sql_file_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() || trimmed.contains(['/', '\\']) || trimmed == "." || trimmed == ".." {
        return Err("nombre de archivo no valido".to_string());
    }
    Ok(if is_sql_file_name(trimmed) {
        trimmed.to_string()
    } else {
        format!("{trimmed}.sql")
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlDirEntry {
    name: String,
    path: String,
    is_dir: bool,
}

/// Contenido de UNA carpeta (sin recursion: el arbol pide cada subcarpeta
/// al expandirla). Solo carpetas y archivos .sql, sin ocultos; carpetas
/// primero y luego por nombre, sin distinguir mayusculas.
pub async fn list_dir(path: String) -> Result<Vec<SqlDirEntry>, String> {
    let dir = absolute_dir(&path)?;
    let mut reader = tokio::fs::read_dir(&dir)
        .await
        .map_err(|error| format!("no se pudo abrir {}: {error}", dir.display()))?;
    let mut entries = Vec::new();
    while let Some(entry) = reader
        .next_entry()
        .await
        .map_err(|error| format!("no se pudo leer {}: {error}", dir.display()))?
    {
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        // metadata() sigue enlaces simbolicos: un enlace a carpeta se
        // muestra como carpeta.
        let Ok(metadata) = tokio::fs::metadata(entry.path()).await else {
            continue;
        };
        let is_dir = metadata.is_dir();
        if !is_dir && !(metadata.is_file() && is_sql_file_name(&name)) {
            continue;
        }
        entries.push(SqlDirEntry {
            name,
            path: entry.path().to_string_lossy().into_owned(),
            is_dir,
        });
    }
    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(entries)
}

/// Crea un .sql vacio en `dir` y devuelve su ruta. Falla si ya existe.
pub async fn create(dir: String, name: String) -> Result<String, String> {
    let dir = absolute_dir(&dir)?;
    let path = dir.join(sql_file_name(&name)?);
    tokio::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .await
        .map_err(|error| match error.kind() {
            std::io::ErrorKind::AlreadyExists => format!("ya existe {}", path.display()),
            _ => format!("no se pudo crear {}: {error}", path.display()),
        })?;
    Ok(path.to_string_lossy().into_owned())
}

/// Manda el .sql a la papelera del sistema (no lo borra para siempre).
pub async fn trash(path: String) -> Result<(), String> {
    let path = sql_path(&path)?;
    tauri::async_runtime::spawn_blocking(move || {
        ::trash::delete(&path)
            .map_err(|error| format!("no se pudo mover a la papelera {}: {error}", path.display()))
    })
    .await
    .map_err(|error| error.to_string())?
}

pub async fn read(path: String) -> Result<String, String> {
    let path = sql_path(&path)?;
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|error| format!("no se pudo leer {}: {error}", path.display()))
}

pub async fn write(path: String, contents: String) -> Result<(), String> {
    let path = sql_path(&path)?;
    tokio::fs::write(&path, contents)
        .await
        .map_err(|error| format!("no se pudo guardar {}: {error}", path.display()))
}

/// Renombra el archivo dentro de su misma carpeta y devuelve la ruta nueva.
/// `new_name` es solo el nombre (sin carpeta); si no trae `.sql`, se agrega.
pub async fn rename(path: String, new_name: String) -> Result<String, String> {
    let from = sql_path(&path)?;
    let file_name = sql_file_name(&new_name)?;
    let to = from
        .parent()
        .ok_or_else(|| "ruta sin carpeta".to_string())?
        .join(file_name);
    if to == from {
        return Ok(to.to_string_lossy().into_owned());
    }
    if tokio::fs::try_exists(&to).await.unwrap_or(false) {
        return Err(format!("ya existe {}", to.display()));
    }
    tokio::fs::rename(&from, &to)
        .await
        .map_err(|error| format!("no se pudo renombrar {}: {error}", from.display()))?;
    Ok(to.to_string_lossy().into_owned())
}

#[cfg(test)]
mod tests {
    use super::{sql_file_name, sql_path};

    #[test]
    fn nombre_de_archivo_agrega_extension_y_rechaza_carpetas() {
        assert_eq!(sql_file_name("ventas").unwrap(), "ventas.sql");
        assert_eq!(sql_file_name("ventas.SQL").unwrap(), "ventas.SQL");
        assert!(sql_file_name("../ventas").is_err());
        assert!(sql_file_name("  ").is_err());
    }

    #[cfg(unix)]
    #[test]
    fn solo_acepta_rutas_absolutas_sql() {
        assert!(sql_path("/tmp/consulta.sql").is_ok());
        assert!(sql_path("/tmp/CONSULTA.SQL").is_ok());
        assert!(sql_path("/etc/passwd").is_err());
        assert!(sql_path("consulta.sql").is_err());
    }
}
