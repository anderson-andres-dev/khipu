# Contribuir a Khipu

Gracias por el interés. El proyecto recién arranca, así que hay bastante
espacio para decisiones de diseño — abrí un issue antes de un PR grande.

## Antes de empezar

Leé [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para entender por qué el
repo está dividido en `engine` / `driver-core` / `drivers/*` / `app`, y qué
capa te toca según lo que quieras aportar.

## Setup local

```bash
mise use -g rust@latest   # o rustup
cargo build
cd app && npm install && npm run tauri dev
```

## Agregar soporte para un nuevo motor de base de datos

Es la forma más directa de contribuir sin pisar el trabajo de nadie más:

1. `cargo new --lib crates/drivers/<motor>`
2. Implementar el trait `DbConnector` de `khipu-driver-core`
3. Agregarlo a `[workspace] members` en el `Cargo.toml` raíz
4. Abrir el PR — no hace falta tocar `engine` ni `app`

## Estilo

- Rust: `cargo fmt` + `cargo clippy` antes de cada PR
- Commits: mensajes cortos en imperativo, en español o inglés, da igual
- Sin abstracciones especulativas: si un motor nuevo necesita algo que el
  trait `DbConnector` no cubre, se discute en el issue antes de forzar la
  interfaz existente
