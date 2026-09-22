# Khipu

Cliente de bases de datos multiplataforma, libre y ligero, con el autocompletado
como prioridad de diseño desde el día uno — no como una capa agregada después.

El nombre viene de los *khipu*, el sistema andino de cuerdas y nudos usado para
registrar y relacionar información. Un nudo amarra cordones entre sí, del mismo
modo que una relación amarra tablas.

## Estado

En construcción. Core: MySQL y PostgreSQL. El resto de motores se suman como
plugins independientes — ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

- **Shell**: [Tauri](https://tauri.app) (Rust)
- **Motor de parsing/autocompletado**: Rust — [`sqlparser`](https://github.com/apache/datafusion-sqlparser-rs) +
  [`tree-sitter`](https://tree-sitter.github.io/tree-sitter/), expuesto como
  [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- **Conectores de base de datos**: [`sqlx`](https://github.com/launchbadge/sqlx) detrás de un trait propio (`DbConnector`)
- **Frontend**: Svelte + [CodeMirror 6](https://codemirror.net/)
- **Licencia**: MIT o Apache-2.0, a tu elección

## Estructura del repo

```
crates/
  engine/          # khipu-engine: parsing + catálogo + autocompletado (agnóstico de dialecto)
  engine-lsp/       # khipu-lsp: binario LSP que envuelve al engine
  driver-core/      # khipu-driver-core: trait DbConnector + tipos compartidos
  drivers/
    mysql/          # khipu-driver-mysql
    postgres/       # khipu-driver-postgres
app/
  src-tauri/        # shell de escritorio (Tauri), consume engine + drivers directo
  src/              # frontend Svelte
docs/
  ARCHITECTURE.md
```

## Desarrollo

Requiere Rust (`mise use -g rust@latest` o [rustup](https://rustup.rs)) y Node 20+.

```bash
cargo build              # compila todo el workspace Rust
cd app && npm install && npm run tauri dev
```

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md). Cada motor de base de datos nuevo se
agrega como un crate en `crates/drivers/` que implementa `DbConnector` — no hace
falta tocar el engine ni la UI.
