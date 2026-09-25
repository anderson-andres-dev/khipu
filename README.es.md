# Khipu

**Cliente SQL de escritorio de código abierto para MySQL, MariaDB y
PostgreSQL, hecho con Tauri, Rust y Svelte.**

Khipu es un espacio de trabajo SQL compacto: conectarse a una base de datos,
explorar su esquema, escribir y ejecutar SQL con autocompletado basado en el
catálogo y editar los resultados en un grid rápido, en una aplicación de
escritorio liviana.

Leer en otros idiomas: [English](README.md).

## Bases de datos soportadas

- PostgreSQL 10+
- MySQL 5.7+
- MariaDB 10.3+

## Funcionalidades

Khipu está en desarrollo activo. Disponible hoy:

**Conexiones**

- Perfiles de conexión con grupos, color de identidad y vista de tarjetas o
  de lista.
- Modo SSL por conexión: Automático (reintenta sin cifrar si no se puede
  negociar TLS), Requerido, Verificar CA, Verificar CA y host o Desactivado,
  con el estado TLS negociado visible.
- Prueba de conexión con un detalle copiable.
- Una conexión por ventana, con "abrir en una ventana nueva" desde el
  selector de conexión.
- Contraseñas en el almacén seguro del sistema cuando se elige Siempre;
  nunca se escriben en los perfiles de conexión.

**Explorador de base de datos**

- Tablas, vistas, vistas materializadas, rutinas, secuencias y eventos.
- Interior de cada tabla: columnas, claves, claves foráneas, índices,
  triggers y checks.
- Selector de schemas visibles y detección de versión y capacidades del
  servidor.
- Visor de la definición (DDL) de una tabla.

**Editor SQL**

- Autocompletado basado en el catálogo.
- Ejecución con `Ctrl+Enter`, con estado y tiempo por sentencia.
- Protección ante sentencias destructivas (`DELETE`/`UPDATE` sin `WHERE`,
  `TRUNCATE`, `DROP ...`) que pide confirmación, revalidada en el backend.
- Pestañas de consola y archivos `.sql`: guardar, abrir (`Ctrl+S`,
  `Ctrl+Shift+S`, `Ctrl+O`), indicador de cambios sin guardar y carpeta de
  scripts por conexión en el sidebar.
- Buscar y reemplazar.

**Resultados**

- Grid rápido con selección de rango, fila y columna, columnas
  redimensionables y tooltips de columna (PK/FK/comentario).
- Paginación en el servidor (`LIMIT`/`OFFSET` reescrito desde el AST),
  conteo total bajo demanda y orden por columna en la base.
- Edición en línea con cambios pendientes, deshacer paso a paso, vista
  previa del SQL y aplicación todo o nada en una transacción.
- Copiar como TSV, CSV, JSON, Markdown o `INSERT` SQL; pegar desde el grid,
  planillas o JSON.
- Exportar resultados a un archivo sin límite de filas.
- Búsqueda en la página (`Ctrl+F`) con filtro de filas.
- Pestañas de tabla con filtros `WHERE` / `ORDER BY` (doble clic en una
  tabla del explorador), pestañas de resultado fijadas y una pestaña Salida
  con el registro de ejecuciones.

**Apariencia**

- Temas oscuros y claros (incluidos Int UI Light y VS Code Light Modern).

## Instalación

Todavía no hay versiones publicadas. Hasta la primera versión, Khipu se
compila desde el código fuente (ver [Desarrollo](#desarrollo)).

Para compilar un binario independiente:

```bash
cd app
npm install
npm run tauri build -- --no-bundle
# binario: target/release/khipu-desktop
```

Sin `--no-bundle`, Tauri también genera los instaladores de cada plataforma
(`.deb`, `.rpm` y AppImage en Linux, `.dmg` en macOS, `.msi`/`.exe` en
Windows) en `target/release/bundle/`.

## Stack

- [Tauri 2](https://tauri.app/) y Rust.
- Svelte 5 y TypeScript.
- [CodeMirror 6](https://codemirror.net/).
- [sqlparser](https://github.com/apache/datafusion-sqlparser-rs) para el
  análisis de sentencias.
- [SQLx](https://github.com/launchbadge/sqlx) para los conectores.

## Desarrollo

Requisitos: Rust 1.85 o posterior y Node.js 20 o posterior. En Linux también
hacen falta las dependencias de sistema de Tauri (WebKitGTK 4.1, GTK 3,
librsvg); ver los
[requisitos de Tauri](https://tauri.app/start/prerequisites/).

```bash
cargo build --workspace
cargo test --workspace

cd app
npm install
npm run check
npm run tauri dev
```

El formato del repositorio se mantiene con `cargo fmt --all` y las
comprobaciones Rust se pueden ejecutar con `cargo clippy --workspace --all-targets`.

Los tests que necesitan una base de datos real están marcados `#[ignore]`;
ver [CONTRIBUTING.md](CONTRIBUTING.md) para correrlos.

## Arquitectura

El motor SQL (análisis, protección de ejecución, paginación y edición) y los
conectores viven en `crates/`. La aplicación Tauri está en `app/src-tauri/`
y la interfaz Svelte en `app/src/`.

La arquitectura de los conectores está documentada en
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Licencia

MIT o Apache-2.0.
