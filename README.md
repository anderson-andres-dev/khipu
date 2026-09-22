# Khipu

**Open-source desktop SQL client for MySQL, MariaDB and PostgreSQL, built
with Tauri, Rust and Svelte.**

Khipu is a compact SQL workspace: connect to a database, browse its schema
and write SQL with schema-aware autocompletion, in a lightweight desktop app.

Read this in other languages: [Español](README.es.md).

## Supported databases

- PostgreSQL
- MySQL
- MariaDB

## Status

Khipu is under active development. Available today:

- Connection profiles for MySQL/MariaDB and PostgreSQL.
- Schema catalog (tables and column metadata).
- SQL editor with catalog-aware autocompletion.
- Secure credential storage via the OS keyring (when "Always" is selected).

Query execution and a results viewer are the next milestone and are not
available yet.

## Stack

- [Tauri 2](https://tauri.app/) and Rust
- Svelte 5 and TypeScript
- [CodeMirror 6](https://codemirror.net/)
- [SQLx](https://github.com/launchbadge/sqlx) for the database connectors

## Development

Requirements: Rust and Node.js 20+.

```bash
cargo build --workspace
cargo test --workspace

cd app
npm install
npm run check
npm run tauri dev
```

Formatting is enforced with `cargo fmt --all`; lints can be run with
`cargo clippy --workspace --all-targets`.

## Architecture

The engine and database connectors live in `crates/`. The Tauri shell is in
`app/src-tauri/` and the Svelte UI in `app/src/`.

Connector architecture is documented in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Credentials are never written to connection profiles in `localStorage`: the
"Always" option stores them in the native OS keyring via `keyring-rs`.

## License

MIT or Apache-2.0.
