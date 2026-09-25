<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/rowly-logo-dark.svg">
  <img alt="Rowly DB" src="docs/assets/brand/rowly-logo.svg" width="300">
</picture>

**Free & Open Source SQL Client**

Connect. Query. Explore.

A lightweight desktop client for PostgreSQL, MySQL and MariaDB.

**100% free · Open source · No Pro edition**

[Download](https://github.com/anderson-andres-dev/rowly-db/releases) · [Español](README.es.md)

</div>

<p align="center">
  <img alt="Rowly DB in its light and dark variants" src="docs/assets/rowly-db.webp">
</p>

## What it is

A desktop SQL client: connect to a database, explore its schema, write queries
with autocompletion and work with the results in a fast, editable grid. It runs
locally, keeps passwords in your system keyring and has no paid tier.

## Install

Download the package for your system from
[Releases](https://github.com/anderson-andres-dev/rowly-db/releases).

| System | Command |
|---|---|
| Debian, Ubuntu | `sudo apt install ./Rowly*.deb` |
| Fedora | `sudo dnf install ./Rowly*.rpm` |
| Arch Linux | `sudo pacman -U rowly-db_*.pkg.tar.zst` |
| Other Linux | `chmod +x Rowly*.AppImage && ./Rowly*.AppImage` |
| Windows, macOS | Run the `.msi`/`.exe` or open the `.dmg` |

**Updates.** Settings → Updates lists every published version. Install the one
you want, newer or older; nothing is installed without asking you.

## Build from source

Requirements: Rust 1.85+, Node.js 20+ and, on Linux, the
[Tauri dependencies](https://tauri.app/start/prerequisites/)
(WebKitGTK 4.1, GTK 3, librsvg).

```bash
git clone https://github.com/anderson-andres-dev/rowly-db.git
cd rowly-db/app
npm install
npm run tauri build
```

The installers land in `target/release/bundle/`.

## Development

```bash
cd app
npm install
npm run tauri dev      # run the app with hot reload
npm run check          # types
npm test               # UI tests
cargo test --workspace # engine and drivers
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the architecture, the database
tests and the release process.

## License

[MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option.
