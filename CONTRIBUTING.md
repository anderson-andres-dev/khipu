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

## Pruebas de contrato de drivers

`cargo test --workspace` corre en verde sin ninguna base de datos disponible:
los tests que necesitan una conexión real están marcados `#[ignore = "requires
database"]`, así que se saltean en una corrida normal.

Para correrlos contra una instancia real:

```bash
cargo test -p khipu-driver-mysql -- --ignored
cargo test -p khipu-driver-postgres -- --ignored
```

Variables de entorno que necesita cada uno:

- MySQL: `KHIPU_TEST_MYSQL_HOST`, `KHIPU_TEST_MYSQL_PORT`, `KHIPU_TEST_MYSQL_USER`,
  `KHIPU_TEST_MYSQL_PASSWORD`, `KHIPU_TEST_MYSQL_DATABASE`
- PostgreSQL: `KHIPU_TEST_POSTGRES_HOST`, `KHIPU_TEST_POSTGRES_PORT`,
  `KHIPU_TEST_POSTGRES_USER`, `KHIPU_TEST_POSTGRES_PASSWORD`,
  `KHIPU_TEST_POSTGRES_DATABASE`

Si falta alguna, el test hace `panic!` con un mensaje indicando qué setear
(no hace falta memorizarlas: el mensaje del panic las lista).

## Estilo

- Rust: `cargo fmt` + `cargo clippy` antes de cada PR
- Commits: mensajes cortos en imperativo, en español o inglés, da igual
- Sin abstracciones especulativas: si un motor nuevo necesita algo que el
  trait `DbConnector` no cubre, se discute en el issue antes de forzar la
  interfaz existente
