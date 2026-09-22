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

Si el motor usa un dialecto SQL ya soportado por `sqlparser` (por ejemplo otro
compatible con MySQL o Postgres), es la forma más directa de contribuir sin
pisar el trabajo de nadie más:

1. `cargo new --lib crates/drivers/<motor>`
2. Implementar el trait `DbConnector` de `khipu-driver-core`
3. Agregarlo a `[workspace] members` en el `Cargo.toml` raíz
4. Agregar la rama correspondiente en la fábrica de drivers de
   `app/src-tauri/src/drivers.rs` — hoy sí hace falta tocar `app` para que el
   motor nuevo sea seleccionable, aunque no haga falta tocar `engine`
5. Abrir el PR

Si el motor necesita un dialecto SQL distinto de los que ya soporta
`sqlparser`/`crates/engine/src/lib.rs` (enum `Dialect`), sí hay que extender
ese enum — discutilo en un issue antes de mandar el PR.

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

## Flujo de ramas y releases

- `main` es la rama por defecto (estilo público) y `develop` la de
  integración. Nada se pushea directo a ninguna de las dos: `develop` y
  `main` tienen branch protection (PR + 1 aprobación + checks de
  `quality.yml` en verde + sin force-push).

1. Abrí un PR desde `feature/...` hacia `develop`.
2. `quality.yml` corre automático (Rust fmt/clippy/test + Node check/build).
3. Confirmá que el check `quality` esté verde.
4. Revisá y probá funcionalmente el cambio en desarrollo.
5. Aprobá y fusioná el PR en `develop`.
6. Para publicar una versión, creá `release/X.Y.Z` desde `develop`.
7. Abrí un PR `release/X.Y.Z → main`.
8. Esperá de nuevo `quality`, aprobá y fusioná.
9. Etiquetá el commit de `main`:
   ```bash
   git switch main
   git pull --ff-only
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
10. El tag dispara `release.yml` (build multiplataforma); esperá a que
    termine en verde.

## Estilo

- Rust: `cargo fmt` + `cargo clippy` antes de cada PR
- Commits: mensajes cortos en imperativo, en español o inglés, da igual
- Sin abstracciones especulativas: si un motor nuevo necesita algo que el
  trait `DbConnector` no cubre, se discute en el issue antes de forzar la
  interfaz existente
