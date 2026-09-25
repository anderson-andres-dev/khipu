# Rowly DB

**Free & Open Source SQL Client**

**Connect. Query. Explore.**

A lightweight desktop client for querying, exploring and understanding databases.

**100% free · Open source · No Pro edition**

[Download](https://github.com/anderson-andres-dev/rowly-db/releases) · [Documentation](docs/ARCHITECTURE.md)

No subscriptions. No Pro edition. No locked features.

Read this in other languages: [Español](README.es.md).

## Supported databases

- PostgreSQL 10+
- MySQL 5.7+
- MariaDB 10.3+

## Features

Rowly DB is under active development. Available today:

**Connections**

- Connection profiles with groups, identity color, and card or list view.
- Per-connection SSL mode: Automatic (retries unencrypted if TLS cannot be
  negotiated), Required, Verify CA, Verify CA and host, or Disabled, with
  the negotiated TLS state visible.
- Connection test with a copyable detail report.
- One connection per window, with "open in a new window" from the
  connection picker.
- Passwords stored in the OS keyring when "Always" is selected; they are
  never written to the connection profiles.

**Database explorer**

- Tables, views, materialized views, routines, sequences and events.
- Table internals: columns, keys, foreign keys, indexes, triggers and
  checks.
- Visible-schema selector and server version/capability detection.
- Table definition (DDL) viewer.

**SQL editor**

- Catalog-aware autocompletion.
- Run with `Ctrl+Enter`, with status and execution time per statement.
- Destructive-statement guard (`DELETE`/`UPDATE` without `WHERE`,
  `TRUNCATE`, `DROP ...`) that asks for confirmation, revalidated in the
  backend.
- Console tabs and `.sql` files: save, open (`Ctrl+S`, `Ctrl+Shift+S`,
  `Ctrl+O`), unsaved-changes indicator and a per-connection scripts folder
  in the sidebar.
- Find and replace.

**Results**

- Fast grid with range, row and column selection, resizable columns and
  column tooltips (PK/FK/comment).
- Server-side pagination (`LIMIT`/`OFFSET` rewritten from the AST), total
  row count on demand and sorting by column in the database.
- Inline editing with pending changes, step-by-step undo, SQL preview and
  all-or-nothing apply in a transaction.
- Copy as TSV, CSV, JSON, Markdown or SQL `INSERT`; paste from the grid,
  spreadsheets or JSON.
- Export results to a file with no row limit.
- In-page search (`Ctrl+F`) with row filtering.
- Table tabs with `WHERE` / `ORDER BY` filters (double-click a table in the
  explorer), pinned result tabs and an Output tab with the execution log.

**Appearance and language**

- Themes: DataGrip, VS Code, Gruvbox and Solarized (dark and light), plus
  One Dark, Dracula and Nord (dark), using each theme's official colors.
- Interface in English, Spanish, Portuguese (Brazil), French and German,
  following the system language by default.

## Installation

There are no published releases yet. Until the first release, Rowly DB is
built from source (see [Development](#development)).

To build a standalone binary:

```bash
cd app
npm install
npm run tauri build -- --no-bundle
# binary: target/release/khipu-desktop
```

Without `--no-bundle`, Tauri also produces the platform installers
(`.deb`, `.rpm` and AppImage on Linux, `.dmg` on macOS, `.msi`/`.exe` on
Windows) under `target/release/bundle/`.

## Stack

- [Tauri 2](https://tauri.app/) and Rust
- Svelte 5 and TypeScript
- [CodeMirror 6](https://codemirror.net/)
- [sqlparser](https://github.com/apache/datafusion-sqlparser-rs) for
  statement analysis
- [SQLx](https://github.com/launchbadge/sqlx) for the database connectors

## Development

Requirements: Rust 1.85+ and Node.js 20+. On Linux, the Tauri system
dependencies are also required (WebKitGTK 4.1, GTK 3, librsvg); see the
[Tauri prerequisites](https://tauri.app/start/prerequisites/).

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

Tests that need a real database are marked `#[ignore]`; see
[CONTRIBUTING.md](CONTRIBUTING.md) for how to run them.

## Rowly DB and Khipu

**Rowly DB** is the product: the desktop application and its public name.
**Khipu** is the internal engine and codename. The Rust crates
(`khipu-engine`, `khipu-driver-*`, `khipu-lsp`), internal identifiers and the
places where the app stores its configuration keep the Khipu name, so existing
settings and saved passwords keep working.

## Architecture

The SQL engine (parsing, execution guard, pagination and editing) and the
database connectors live in `crates/`. The Tauri shell is in
`app/src-tauri/` and the Svelte UI in `app/src/`.

Connector architecture is documented in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## License

MIT or Apache-2.0.
