# Arquitectura

## Principio

El core (parsing, catálogo, autocompletado) no sabe que existe Tauri, Svelte
ni ningún motor de base de datos concreto. Todo lo que sabe es el trait
`DbConnector` (`crates/driver-core`) y un `SchemaCatalog` genérico
(`crates/engine/src/catalog.rs`). Esto es lo que permite que:

- alguien integre `khipu-lsp` en Neovim/VSCode sin tocar la app de escritorio
- alguien agregue soporte para SQLite/MariaDB/DuckDB sin tocar el engine
- el engine se pueda testear sin levantar una base de datos real

## Capas

1. **`crates/engine`** — dialecto-agnóstico. Parsing tolerante a errores del
   buffer mientras se escribe (tree-sitter, pendiente de integrar), validación
   contra la gramática real por dialecto (`sqlparser`), resolución de contexto
   en el cursor, y ranking de sugerencias contra el `SchemaCatalog`.
2. **`crates/engine-lsp`** — expone `khipu-engine` como servidor LSP
   (`tower-lsp`) para que cualquier editor lo consuma.
3. **`crates/driver-core`** — el contrato (`DbConnector`) que todo motor de
   base de datos debe implementar: conectar, listar schemas, listar tablas y
   columnas. El engine y la app solo dependen de este trait.
4. **`crates/drivers/*`** — un crate por motor de base de datos
   (`khipu-driver-mysql`, `khipu-driver-postgres`, ...), cada uno implementando
   `DbConnector` sobre `sqlx`.
5. **`app/src-tauri`** — el shell de escritorio. Depende directo de
   `khipu-engine` y de los drivers (sin pasar por LSP/stdio) para minimizar
   latencia dentro de la propia app.
6. **`app/src`** — frontend Svelte, editor CodeMirror 6.

## Cómo sumar un motor de base de datos nuevo

1. Crear `crates/drivers/<motor>` (`cargo new --lib`).
2. Implementar `DbConnector` para ese motor.
3. Agregarlo como miembro del workspace y como dependencia opcional de `app/src-tauri`.

No requiere cambios en `khipu-engine` ni en el frontend.

## Roadmap de motores

MySQL → PostgreSQL → a definir según demanda de la comunidad.
