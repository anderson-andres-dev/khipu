# Khipu

Khipu es un cliente de escritorio para trabajar con bases de datos SQL, con
un editor y autocompletado orientados a una sesión de trabajo compacta.

## Estado

En desarrollo. Actualmente soporta:

- MySQL y MariaDB mediante el conector MySQL.
- PostgreSQL.
- Catálogo inicial de tablas y metadatos.
- Editor SQL con sugerencias basadas en el catálogo.
- Perfiles de conexión locales.
- Contraseñas en el almacén seguro del sistema cuando se elige Siempre.

El catálogo y la sesión de base de datos todavía son una primera integración;
la ejecución de consultas y los resultados se incorporarán después.

## Stack

- Tauri 2 y Rust.
- Svelte 5 y TypeScript.
- CodeMirror 6.
- SQLx para los conectores.

## Desarrollo

Requisitos: Rust y Node.js 20 o posterior.

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

## Arquitectura

El motor y los conectores viven en `crates/`. La aplicación Tauri está en
`app/src-tauri/` y la interfaz Svelte en `app/src/`.

La arquitectura de los conectores está documentada en
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Las credenciales no se escriben en los perfiles de `localStorage`: la opción
Siempre usa el keyring nativo del sistema operativo mediante `keyring-rs`.

## Licencia

MIT o Apache-2.0.
