# Contribuir a Rowly DB

Gracias por el interés. El proyecto recién arranca, así que hay bastante
espacio para decisiones de diseño — abrir un issue antes de un PR grande.

**Rowly DB** es el nombre del producto; **Khipu** es el nombre interno del
motor. En el código vas a ver `khipu-*` (crates, identificadores, claves de
configuración): es a propósito y no hay que renombrarlo. Los textos que ve el
usuario dicen Rowly DB.

## Antes de empezar

Leer [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para entender por qué el
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
2. Implementar el trait `DbConnector` de `khipu-driver-core`, incluido
   `introspect_schema` (ver `docs/design/explorador-base-de-datos.md`)
3. Agregarlo a `[workspace] members` en el `Cargo.toml` raíz
4. Agregar la rama correspondiente en la fábrica de drivers de
   `app/src-tauri/src/drivers.rs` — hoy sí hace falta tocar `app` para que el
   motor nuevo sea seleccionable, aunque no haga falta tocar `engine`
5. Abrir el PR

Si el motor necesita un dialecto SQL distinto de los que ya soporta
`sqlparser`/`crates/engine/src/lib.rs` (enum `Dialect`), sí hay que extender
ese enum — discútelo en un issue antes de mandar el PR.

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

Opcionales, para los tests de TLS (`<MOTOR>` es `MYSQL` o `POSTGRES`):

- `KHIPU_TEST_<MOTOR>_EXPECT_TLS`: qué debería negociar el servidor en modo
  Automático. `encrypted` si tiene TLS moderno, `fallback` si ofrece TLS que
  rustls no puede negociar (MySQL 5.7), `none` si no tiene TLS habilitado.
  Sin la variable, solo se comprueba lo que vale para cualquier servidor.
- `KHIPU_TEST_<MOTOR>_CA_CERT`: ruta a la CA que firmó el certificado del
  servidor, para probar "Verificar CA" y "Verificar CA y host". El
  certificado tiene que incluir el host del test en su subjectAltName.

## Flujo de ramas y releases

- `main` es la rama por defecto y `develop` la de integración. Nada se
  pushea directo a ninguna de las dos: `develop` y `main` tienen branch
  protection (PR + 1 aprobación + checks de `quality.yml` en verde + sin
  force-push).

1. Abrir un PR desde `feature/...` hacia `develop`.
2. `quality.yml` corre automático (Rust fmt/clippy/test + Node check/build).
3. Confirmar que el check `quality` esté verde.
4. Revisar y probar funcionalmente el cambio en desarrollo.
5. Aprobar y fusionar el PR en `develop`.
6. Para publicar una versión, crear `release/X.Y.Z` desde `develop`.
7. Abrir un PR `release/X.Y.Z → main`.
8. Esperar de nuevo `quality`, aprobar y fusionar.
9. Etiquetar el commit de `main`:
   ```bash
   git switch main
   git pull --ff-only
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
10. El tag dispara `release.yml` (build multiplataforma); esperar a que
    termine en verde.

## Estilo

- Rust: `cargo fmt` + `cargo clippy` antes de cada PR
- Commits: mensajes cortos en imperativo, en español o inglés, da igual
- Sin abstracciones especulativas: si un motor nuevo necesita algo que el
  trait `DbConnector` no cubre, se discute en el issue antes de forzar la
  interfaz existente
